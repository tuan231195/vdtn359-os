import { LookupArray } from 'src/types/lookup-array';

describe('lookupArray', () => {
	it('has', () => {
		const arr = new LookupArray([1, 2, 3]);

		expect(arr.has(1)).toBeTruthy();
		expect(arr.has(4)).toBeFalsy();
	});

	it('get', () => {
		const arr = new LookupArray([1, 2, 3]);

		expect(arr.get(1)).toEqual(2);
		expect(arr.get(4)).toEqual(undefined);
	});

	it('push', () => {
		let arr = new LookupArray([1, 2, 3]);

		expect([...arr.push(1)]).toEqual([1, 2, 3, 1]);

		arr = new LookupArray([1, 2, 3], false);

		expect([...arr.push(1)]).toEqual([1, 2, 3]);
	});

	it('insert', () => {
		let arr = new LookupArray([1, 2, 3]);

		expect([...arr.insert(1, 1)]).toEqual([1, 1, 2, 3]);

		arr = new LookupArray([1, 2, 3], false);

		expect([...arr.push(1)]).toEqual([1, 2, 3]);
	});

	it('pop', () => {
		const arr = new LookupArray([1, 2, 3]);

		expect(arr.pop()).toEqual(3);
	});

	it('indexOf', () => {
		const arr = new LookupArray([1, 2, 3]);

		expect(arr.indexOf(2)).toEqual(1);
		expect(arr.indexOf(4)).toEqual(-1);
	});

	it('length', () => {
		expect(new LookupArray([1, 2, 3]).length).toEqual(3);
		expect(new LookupArray().length).toEqual(0);
	});

	it('remove', () => {
		const arr = new LookupArray([1, 2, 3]);

		expect(arr.remove(4)).toEqual([1, 2, 3]);
		expect(arr.remove(3)).toEqual([1, 2]);
	});

	it('removeAt', () => {
		const arr = new LookupArray([1, 2, 3]);

		expect(arr.removeAt(1)).toEqual(2);
		expect(arr.removeAt(4)).toEqual(null);
	});
});
