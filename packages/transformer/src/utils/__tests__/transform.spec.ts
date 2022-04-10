import { toClass, toPlain } from 'src/index';
import { Book } from 'src/utils/__tests__/models/book';
import { User } from './models/user';

const sampleDate = new Date(Date.UTC(2020, 3, 30, 0, 0, 0));
describe('toPlain', () => {
	it('convert date to string when transformDate is on or no options is given', () => {
		expect(toPlain(sampleDate)).toEqual('2020-04-30T00:00:00.000Z');
	});

	it('keep date the same when transformDate is off', () => {
		const date = sampleDate;
		expect(
			toPlain(date, undefined, {
				transformDate: false,
			})
		).toEqual(date);
	});

	it('respect alias', () => {
		const book = new Book({
			alias: 'My Book',
		});
		expect(toPlain(book)).toEqual({
			alias: 'My Book',
		});
	});

	it('exclude properties', () => {
		const book = new Book({
			alias: 'My Book',
		});
		book.isbn = '1234';
		expect(toPlain(book)).toEqual({
			alias: 'My Book',
		});
	});

	it('convert class to plain correctly', () => {
		const user = new User();
		user.firstName = 'Tuan';
		user.lastName = 'Nguyen';
		user.password = '123';
		user.dob = sampleDate;
		user.friends = [
			{
				lastName: 'World',
				password: '123',
				firstName: 'Hello',
			},
		];
		user.manager = {
			lastName: 'Manager',
			password: '123',
			firstName: 'My',
		};
		expect(toPlain(user)).toEqual({
			firstName: 'Tuan',
			lastName: 'Nguyen',
			dob: '2020-04-30T00:00:00.000Z',
			friends: [
				{
					firstName: 'Hello',
					lastName: 'World',
				},
			],
			manager: {
				lastName: 'Manager',
				firstName: 'My',
			},
		});
	});

	it('respect ignoreDecorators', () => {
		const user = new User();
		user.firstName = 'Tuan';
		user.lastName = 'Nguyen';
		user.password = '123';
		user.friends = [
			{
				lastName: 'World',
				password: '123',
				firstName: 'Hello',
			},
		];
		expect(
			toPlain(user, User, {
				ignoreDecorators: true,
			})
		).toEqual({
			firstName: 'Tuan',
			password: '123',
			lastName: 'Nguyen',
			friends: [
				{
					firstName: 'Hello',
					password: '123',
					lastName: 'World',
				},
			],
		});
	});

	it('respect groups', () => {
		const user = new User();
		user.secret = 'abc';
		user.firstName = 'Tuan';
		user.exclude = 'Exclude';

		expect(toPlain(user)).toEqual({
			firstName: 'Tuan',
			exclude: 'Exclude',
		});

		expect(
			toPlain(user, undefined, {
				groups: ['secret'],
			})
		).toEqual({
			firstName: 'Tuan',
			secret: 'abc',
		});
	});

	it('respect ignore groups', () => {
		const user = new User();
		user.secret = 'abc';
		user.firstName = 'Tuan';
		user.exclude = 'Exclude';

		expect(
			toPlain(user, undefined, {
				ignoreGroups: true,
			})
		).toEqual({
			firstName: 'Tuan',
			exclude: 'Exclude',
			secret: 'abc',
		});
	});

	it('respect excludeIf in field options', () => {
		const user = new User();
		user.excludeIf = 1;
		user.firstName = 'Tuan';

		expect(
			toPlain(user, undefined, {
				groups: ['excludeIf'],
			})
		).toEqual({
			firstName: 'Tuan',
		});

		user.excludeIf = 2;

		expect(
			toPlain(user, undefined, {
				groups: ['excludeIf'],
			})
		).toEqual({
			firstName: 'Tuan',
			excludeIf: 2,
		});
	});

	it('respect excludeIf in transform options', () => {
		const user = new User();
		user.firstName = 'Tuan';
		user.lastName = 'Nguyen';
		user.city = 'Hanoi';

		expect(
			toPlain(user, undefined, {
				excludeIf(key, value) {
					return value === 'Nguyen' || key === 'city';
				},
			})
		).toEqual({
			firstName: 'Tuan',
		});
	});

	it('transform property value using transform options', () => {
		const user = new User();
		user.excludeIf = 4;

		expect(
			toPlain(user, undefined, {
				transform: (key, value) =>
					key === 'excludeIf' ? value * 2 : value,
				groups: ['excludeIf'],
			})
		).toEqual({
			excludeIf: 8,
		});
	});
});

describe('toClass', () => {
	it('convert plain to class correctly', () => {
		const plainUser = {
			firstName: 'Tuan',
			lastName: 'Nguyen',
			password: '123',
			dob: '2020-04-30T00:00:00.000Z',
			friends: [
				{
					firstName: 'Hello',
					lastName: 'World',
					password: '123',
				},
			],
		};
		const user = toClass(plainUser, User);
		expect(user).toBeInstanceOf(User);
		expect(user.friends[0]).toBeInstanceOf(User);
		expect(user.dob).toEqual(sampleDate);
		expect(JSON.stringify(user)).toEqual(JSON.stringify(plainUser));
	});

	it('respect alias', () => {
		const plainBook = {
			alias: 'My Book',
		};
		const book = toClass(plainBook, Book);
		expect(book).toBeInstanceOf(Book);
		expect(JSON.stringify(book)).toEqual(
			JSON.stringify({
				name: 'My Book',
				nameUpperCase: 'MY BOOK',
			})
		);
	});

	it('exclude properties', () => {
		const plainBook = {
			alias: 'My Book',
			isbn: '12345',
		};

		const book = toClass(plainBook, Book);
		expect(book).toBeInstanceOf(Book);
		expect(JSON.stringify(book)).toEqual(
			JSON.stringify({
				name: 'My Book',
				nameUpperCase: 'MY BOOK',
			})
		);
	});

	it('respect ignoreDecorators', () => {
		const plainBook = {
			alias: 'My Book',
			isbn: '12345',
		};

		const book = toClass(plainBook, Book, {
			ignoreDecorators: true,
		});
		expect(book).toBeInstanceOf(Book);
		expect(JSON.stringify(book)).toEqual(
			JSON.stringify({
				name: 'My Book',
				nameUpperCase: 'MY BOOK',
				isbn: '12345',
			})
		);
	});

	it('respect excludeIf in field options', () => {
		const plainUser = {
			excludeIf: 1,
			firstName: 'Tuan',
		};

		expect(
			JSON.stringify(
				toClass(plainUser, User, {
					groups: ['excludeIf'],
				})
			)
		).toEqual(
			JSON.stringify({
				firstName: 'Tuan',
			})
		);

		plainUser.excludeIf = 2;

		expect(
			JSON.stringify(
				toClass(plainUser, User, {
					groups: ['excludeIf'],
				})
			)
		).toEqual(
			JSON.stringify({
				firstName: 'Tuan',
				excludeIf: 2,
			})
		);
	});
});
