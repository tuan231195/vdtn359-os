import Zongji from '@vlasky/zongji';
import type BinlogListenerType from 'zongji';
import exitHook from 'exit-hook';
import {
	bufferTime,
	catchError,
	concatMap,
	defer,
	EMPTY,
	filter,
	retry,
	Subject,
	throwError,
	timer,
} from 'rxjs';
import { ListenerOptions, ProcessingOptions, RecordMapping } from 'src/options';
import { Position } from './positionTracker';

export class BinlogListener {
	private zongji: BinlogListenerType;
	private subject: Subject<any>;

	static ACCEPTABLE_ERRORS = [
		'PROTOCOL_CONNECTION_LOST',
		// MySQL 5.1 emits a packet sequence error when the binlog disconnected
		'PROTOCOL_INCORRECT_PACKET_SEQUENCE',
	];

	constructor(private readonly listenerOptions: ListenerOptions) {
		this.init(listenerOptions);
	}

	public handleBatch(
		processingOptions: ProcessingOptions = {},
		handler: (items: any[]) => Promise<void>
	) {
		const {
			bufferCount: count = 10,
			bufferTime: time = 200,
			maxRetryCount = 0,
			retryDelay = 0,
		} = processingOptions;
		return this.subject
			.pipe(
				bufferTime(time, null, count),
				filter((items) => items.length > 0),
				concatMap((items) => {
					return defer(() => handler(items).then(() => items)).pipe(
						retry({
							delay: (err, retryCount) => {
								console.warn(
									`Attempt ${retryCount}: Failed to process binlog events`,
									err
								);
								if (
									maxRetryCount === -1 ||
									retryCount < maxRetryCount
								) {
									return timer(retryDelay * retryCount);
								}

								return throwError(err);
							},
						}),
						catchError(() => {
							console.error(
								`Discarding ${items.length} failed events`
							);
							// ignore the error and continue
							return EMPTY;
						})
					);
				})
			)
			.subscribe((items) => {
				console.info(`Processed ${items.length} items`);
			});
	}

	private init(listenerOptions: ListenerOptions) {
		const { whitelist, blacklist, ...connectionOptions } = listenerOptions;
		console.info(
			`Initialize binlog listener with options ${JSON.stringify(
				{ whitelist, blacklist },
				null,
				4
			)}`
		);
		this.zongji = new Zongji(connectionOptions);
	}

	private setupListeners() {
		this.subject = new Subject();

		this.zongji.on('ready', () => {
			console.info('Successfully started binlog listener');
		});

		this.zongji.on('binlog', (evt) => {
			const transformedEvent = this.transformEvent(evt);
			if (transformedEvent) {
				this.subject.next(transformedEvent);
			}
		});

		this.zongji.on('error', (error) => {
			console.error('Encountered error: ', error);
			if (!BinlogListener.ACCEPTABLE_ERRORS.includes(error.code)) {
				this.subject.error(error);
			}
		});

		exitHook(() => {
			console.info('Stopping binlog listener');
			this.zongji.stop();
			this.subject.complete();
		});
	}

	start(position?: Position) {
		console.info('Start zongji at position', position);
		const isReady = (this.zongji as any).ready;
		if (!isReady) {
			this.setupListeners();
		} else {
			this.zongji.stop();
		}

		this.zongji.start({
			...position,
			includeSchema: BinlogListener.convertToSchema(
				this.listenerOptions.whitelist
			),
			excludeSchema: this.listenerOptions.whitelist
				? undefined
				: BinlogListener.convertToSchema(
						this.listenerOptions.blacklist
				  ),
			includeEvents: [
				'tablemap',
				'writerows',
				'updaterows',
				'deleterows',
				'rotate',
			],
		});
	}

	private transformEvent(evt: Zongji.Event) {
		const eventName = evt.getEventName();
		if (eventName === 'tablemap' || eventName === 'rotate') {
			return null;
		}
		const { filename, position } = evt._zongji.options;
		return {
			eventName: BinlogListener.getEventName(eventName),
			rows: evt.rows.map((row) => this.transformRow(evt, row)),
			position: { filename, position },
		};
	}

	static getEventName(eventName) {
		if (eventName === 'writerows') {
			return 'INSERT';
		}
		if (eventName === 'updaterows') {
			return 'UPDATE';
		}
		if (eventName === 'deleterows') {
			return 'DELETE';
		}
		throw new Error('unknown event');
	}

	private transformRow(evt: Zongji.Event, row: any) {
		let transformedRow = row;
		if (!(row.before && row.after)) {
			transformedRow = {
				before: row,
				after: row,
			};
		}
		transformedRow.before = this.transformObject(
			evt,
			transformedRow.before
		);
		transformedRow.after = this.transformObject(evt, transformedRow.after);
		return transformedRow;
	}

	private transformObject(evt: Zongji.Event, object: object) {
		const table = evt.tableMap?.[evt.tableId];
		if (!table) {
			return {};
		}
		const { parentSchema: databaseName, tableName } = table;
		return Object.fromEntries(
			Object.entries(object)
				.map(([key, value]) => {
					if (
						BinlogListener.isInSchema({
							databaseName,
							tableName,
							columnName: key,
							recordMapping: this.listenerOptions.blacklist,
						})
					) {
						return null;
					}

					if (
						BinlogListener.isInSchema({
							databaseName,
							tableName,
							columnName: key,
							recordMapping: this.listenerOptions.whitelist,
						})
					) {
						return [key, value];
					}
					return null;
				})
				.filter(Boolean)
		);
	}

	private static isInSchema({
		databaseName,
		tableName,
		columnName,
		recordMapping,
	}: {
		databaseName: string;
		tableName: string;
		columnName: string;
		recordMapping?: RecordMapping;
	}) {
		if (!recordMapping) {
			return false;
		}
		if (typeof recordMapping?.[databaseName] === 'boolean') {
			return recordMapping[databaseName];
		}
		if (typeof recordMapping?.[databaseName]?.[tableName] === 'boolean') {
			return recordMapping[databaseName][tableName];
		}
		return !!recordMapping?.[databaseName]?.[tableName]?.[columnName];
	}

	private static convertToSchema(recordMapping?: RecordMapping) {
		if (!recordMapping) {
			return undefined;
		}
		return Object.fromEntries(
			Object.entries(recordMapping).map(([key, value]) => {
				if (typeof value === 'boolean') {
					return [key, value];
				}

				return [key, Object.keys(value)];
			})
		);
	}
}
