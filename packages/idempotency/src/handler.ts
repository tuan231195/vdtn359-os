import { BaseStore, Item, ItemStatus } from 'src/persistence';
import {
	CurrentlyProcessingError,
	IdempotencyKeyAlreadyExists,
} from 'src/errors';

export interface IdempotencyHandlerProps<T> {
	idempotencyKey?: string;
	ttlInMillis?: number;
	timeoutInMills?: number;
	handler: () => T;
}

export type IdempotencyHandlers<T> = (props: IdempotencyHandlerProps<T>) => T;

export function handleIdempotency(storage: BaseStore, logger = console) {
	return async <T>({
		idempotencyKey,
		ttlInMillis,
		timeoutInMills,
		handler,
	}: IdempotencyHandlerProps<T>) => {
		if (!idempotencyKey) {
			return handler();
		}
		const inProgressItem: Item<T> = {
			ttl:
				ttlInMillis !== undefined
					? Math.floor((Date.now() + ttlInMillis) / 1000)
					: undefined,
			timeout:
				timeoutInMills !== undefined
					? Date.now() + timeoutInMills
					: undefined,
			status: ItemStatus.IN_PROGRESS,
			createdAt: Date.now(),
			idempotencyKey,
		};

		const handleItem = async (forceInProgress = false) => {
			await storage.putItem(inProgressItem, forceInProgress);
			logger.info(
				`Calling handler with idempotencyKey ${idempotencyKey}`
			);
			let result;
			try {
				result = await handler();
			} catch (err) {
				logger.info(
					`Processing failed for idempotencyKey ${idempotencyKey}. Removing idempotency item`
				);
				await storage.removeItem(idempotencyKey);
				throw err;
			}
			const succeededItem = {
				...inProgressItem,
				ttl:
					ttlInMillis !== undefined
						? Math.floor((Date.now() + ttlInMillis) / 1000)
						: undefined,
				timeout: undefined,
				status: ItemStatus.RESOLVED,
				result,
			};
			await storage.putItem(succeededItem, true);
			return result;
		};

		try {
			return await handleItem(false);
		} catch (err) {
			if (err instanceof IdempotencyKeyAlreadyExists) {
				const item = await storage.getItem(idempotencyKey);
				logger.info('Item already exists', item);
				if (!item || isItemInProgressExpired(item)) {
					return handleItem(true);
				}
				if (item.status === ItemStatus.RESOLVED) {
					return item.result;
				}
				throw new CurrentlyProcessingError();
			}
			throw err;
		}
	};
}

function isItemInProgressExpired(item: Item<any>) {
	return (
		item.status === ItemStatus.IN_PROGRESS &&
		item.timeout !== undefined &&
		item.timeout < Date.now()
	);
}
