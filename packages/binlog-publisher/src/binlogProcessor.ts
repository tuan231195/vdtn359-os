import { ProcessingOptions } from 'src/options';
import { BinlogListener } from 'src/binlogListener';
import {
	bufferTime,
	catchError,
	concatMap,
	EMPTY,
	filter,
	from,
	retry,
	throwError,
	timer,
} from 'rxjs';
import { BinlogPublisher } from 'src/publishers/interface';
import { PositionTracker } from 'src/positionTracker';

export class BinlogProcessor {
	private currentItems: any[] = [];

	constructor(
		private readonly options: ProcessingOptions,
		private readonly binlogListener: BinlogListener,
		private readonly binlogPublisher: BinlogPublisher,
		private readonly positionTracker: PositionTracker | null
	) {}

	start() {
		const {
			bufferCount: count = 10,
			bufferTime: time = 200,
			maxRetryCount = 0,
			retryDelay = 0,
		} = this.options;

		return this.binlogListener.subject
			.pipe(
				bufferTime(time, null, count),
				filter((items) => items.length > 0),
				concatMap((items) => {
					const partitions = this.binlogPublisher.partition(items);

					return from(partitions).pipe(
						concatMap(async (partition) => {
							if (!this.currentItems.length) {
								this.currentItems = partition.items;
							}
							const { failed } =
								await this.binlogPublisher.publishItems(
									this.currentItems
								);
							if (failed.length) {
								this.currentItems = failed;
								throw new Error(
									'Partial failure when publishing items'
								);
							}
							this.currentItems = [];
							return partition.items;
						}),
						retry({
							delay: (err, retryCount) => {
								console.warn(
									`Attempt ${retryCount}: Failed to process ${this.currentItems.length} binlog events`,
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
			.subscribe(async (items) => {
				console.info(`Processed ${items.length} items`);

				const lastItemPosition = items[items.length - 1]?.position;
				if (lastItemPosition && this.positionTracker) {
					await this.positionTracker.commit(lastItemPosition);
				}
			});
	}
}
