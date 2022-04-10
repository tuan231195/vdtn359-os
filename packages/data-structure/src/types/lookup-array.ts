export class LookupArray<T = any> {
	private arr: Array<T>;

	private set: Set<T>;

	constructor(source: Array<T> = [], private allowDuplicate = true) {
		this.arr = [...source];
		this.set = new Set(this.arr);
	}

	get(index: number) {
		return this.arr[index];
	}

	has(value: T) {
		return this.set.has(value);
	}

	push(value: T) {
		if (!this.allowDuplicate && this.has(value)) {
			return this.arr;
		}
		this.set.add(value);
		this.arr.push(value);

		return this.arr;
	}

	pop() {
		const item = this.arr.pop();
		this.set.delete(item);

		return item;
	}

	insert(index: number, value: T) {
		if (!this.allowDuplicate && this.has(value)) {
			return this.arr;
		}

		this.set.add(value);
		this.arr.splice(index, 0, value);

		return this.arr;
	}

	indexOf(value: T) {
		return this.arr.indexOf(value);
	}

	get length() {
		return this.arr.length;
	}

	remove(value: T) {
		this.set.delete(value);
		this.arr = this.arr.filter((current) => current !== value);

		return this.arr;
	}

	removeAt(index: number) {
		if (index < 0 || index >= this.arr.length) {
			return null;
		}
		const item = this.arr[index];
		this.arr.splice(index, 1);
		this.set.delete(item);

		return item;
	}

	[Symbol.iterator]() {
		return this.arr[Symbol.iterator]();
	}
}
