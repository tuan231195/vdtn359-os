export enum ItemStatus {
	IN_PROGRESS = 'in_progress',
	RESOLVED = 'resolved',
}

export interface Item<T> {
	idempotencyKey: string;

	status: ItemStatus;

	createdAt: number;

	result?: T;

	ttl?: number;

	timeout?: number;
}

export interface BaseStore {
	getItem<T>(key: string): Promise<Item<T> | null>;

	removeItem(key: string): Promise<void>;

	putItem<T>(item: Item<T>, force?: boolean): Promise<Item<T>>;
}
