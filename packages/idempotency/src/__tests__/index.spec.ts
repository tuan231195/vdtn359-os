import { handleIdempotency, IdempotencyHandlerProps } from 'src/handler';
import { BaseStore, DynamoDbStore, ItemStatus } from 'src/persistence';
import { CurrentlyProcessingError } from 'src/errors';

const ITEM = { ok: true };

describe.skip('handleIdempotency', () => {
	let idempotencyHandler: (item: IdempotencyHandlerProps<any>) => any;
	let handler: jest.Mock;
	let idempotencyKey: string;
	let store: BaseStore;

	beforeEach(() => {
		store = new DynamoDbStore(
			{
				endpoint: 'http://localhost:4566',
				region: 'eu-central-1',
			},
			'idempotency'
		);
		idempotencyKey = Math.random().toString(16);
		handler = jest.fn().mockResolvedValue(ITEM);
		idempotencyHandler = handleIdempotency(store);
	});
	afterEach(() => {
		jest.restoreAllMocks();
	});

	it('Should call handler when there is no item', async () => {
		const result = await idempotencyHandler({
			handler,
			idempotencyKey,
		});

		expect(handler).toHaveBeenCalledTimes(1);
		expect(result).toEqual(ITEM);
	});

	it('Should call handler when there is a resolved item but it has expired', async () => {
		await store.putItem({
			idempotencyKey,
			status: ItemStatus.RESOLVED,
			createdAt: Date.now(),
			ttl: Math.floor(Date.now() / 1000) - 1,
		});
		const result = await idempotencyHandler({
			handler,
			idempotencyKey,
		});

		expect(handler).toHaveBeenCalledTimes(1);
		expect(result).toEqual(ITEM);
	});

	it('Should call handler when there is an inprogress item but it has expired', async () => {
		await store.putItem({
			idempotencyKey,
			status: ItemStatus.IN_PROGRESS,
			createdAt: Date.now(),
			ttl: Date.now() + 100000,
			timeout: Date.now() - 1,
		});
		const result = await idempotencyHandler({
			handler,
			idempotencyKey,
		});

		expect(handler).toHaveBeenCalledTimes(1);
		expect(result).toEqual(ITEM);
	});

	it('Should not call handler when there is a resolved item and it is not expired', async () => {
		await store.putItem({
			idempotencyKey,
			status: ItemStatus.RESOLVED,
			createdAt: Date.now(),
			ttl: Math.floor(Date.now() / 1000) + 5,
			result: ITEM,
		});
		const result = await idempotencyHandler({
			handler,
			idempotencyKey,
		});

		expect(handler).not.toHaveBeenCalled();
		expect(result).toEqual(ITEM);
	});

	it('Should not call handler and throw an error when there is a in progress item and it has not expired', async () => {
		await store.putItem({
			idempotencyKey,
			status: ItemStatus.IN_PROGRESS,
			createdAt: Date.now(),
			timeout: Date.now() + 5000,
			result: ITEM,
		});
		await expect(() =>
			idempotencyHandler({
				handler,
				idempotencyKey,
			})
		).rejects.toThrow(new CurrentlyProcessingError());

		expect(handler).not.toHaveBeenCalled();
	});
});
