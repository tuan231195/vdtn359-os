import { KeyExtractor } from 'src/options';

export class Partition<T extends object> {
	public items: T[] = [];
	private readonly keyTracker: Record<string, boolean> = {};

	constructor(
		private readonly partitionKey: KeyExtractor | undefined,
		private readonly distinctKey = true,
		private readonly maxLength = Number.MAX_SAFE_INTEGER
	) {}

	add(item: T) {
		if (!this.accept(item)) {
			return false;
		}
		this.items.push(item);
		const itemKey = this.getItemKey(item);
		if (itemKey) {
			this.keyTracker[itemKey] = true;
		}
		return true;
	}

	hasItemWithSameKey(item: T) {
		const itemKey = this.getItemKey(item);
		if (!itemKey) {
			return false;
		}
		return !!this.keyTracker[itemKey];
	}

	getItemKey(item: T) {
		const partitionKey =
			typeof this.partitionKey === 'function'
				? this.partitionKey(item)
				: item[this.partitionKey];
		return partitionKey ?? null;
	}

	getKeys() {
		return Object.keys(this.keyTracker);
	}

	removeItemsWithKeys(keys: string[]) {
		const itemsToRemove = [];
		const newItems = [];
		for (const item of this.items) {
			if (keys.includes(this.getItemKey(item))) {
				itemsToRemove.push(item);
			} else {
				newItems.push(item);
			}
		}

		this.items = newItems;
		return itemsToRemove;
	}

	accept(item: T) {
		if (this.items.length >= this.maxLength) {
			return false;
		}
		return !(this.distinctKey && this.hasItemWithSameKey(item));
	}
}
