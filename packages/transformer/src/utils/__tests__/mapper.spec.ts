import { Mapper } from 'src/index';
import { Book } from 'src/utils/__tests__/models/book';
import { CustomDto, InnerDto } from 'src/utils/__tests__/models/custom.dto';
import { Custom, Inner } from './models/custom';
import { User } from './models/user';

const sampleDate = new Date(Date.UTC(2020, 3, 30, 0, 0, 0));
describe('Mapper', () => {
	describe('transform to plain object', () => {
		it('respect alias', () => {
			const mapper = new Mapper(Book);
			const result = mapper.mapDefault().transform(
				new Book({
					alias: 'New Book',
				})
			);
			expect(result).toEqual({
				alias: 'New Book',
			});
		});

		it('respect ignoreDecorators', () => {
			const mapper = new Mapper(Book);
			const book = new Book({
				alias: 'New Book',
			});
			book.isbn = 'abc';
			const result = mapper.mapDefault().transform(book, {
				ignoreDecorators: true,
			});
			expect(result).toEqual({
				alias: 'New Book',
				isbn: 'abc',
				nameUpperCase: 'NEW BOOK',
			});
		});

		it('respect transformDate', () => {
			const mapper = new Mapper(User);
			const user = new User();
			user.dob = sampleDate;
			let result = mapper.mapDefault().transform(user);
			expect(result).toEqual({
				dob: '2020-04-30T00:00:00.000Z',
			});

			result = mapper.mapDefault().transform(user, {
				transformDate: false,
			});
			expect(result).toEqual({
				dob: sampleDate,
			});
		});

		it('Support custom path', () => {
			const mapper = new Mapper(User);
			const user = new User();
			user.firstName = 'Tuan';
			user.lastName = 'Nguyen';
			user.dob = sampleDate;

			mapper
				.mapDefault()
				.map('lastName', 'surName')
				.map('dob', 'dateOfBirth');
			expect(mapper.transform(user)).toEqual({
				firstName: 'Tuan',
				surName: 'Nguyen',
				dateOfBirth: '2020-04-30T00:00:00.000Z',
			});
		});

		it('Support custom mapper', () => {
			const mapper = new Mapper(User);
			const user = new User();
			user.firstName = 'Tuan';
			user.lastName = 'Nguyen';
			user.dob = sampleDate;

			const managerMapper = new Mapper(User).mapDefault();
			managerMapper.map('firstName', 'givenName');
			managerMapper.map('lastName', 'familyName');
			user.manager = {
				lastName: 'Manager',
				password: '123',
				firstName: 'My',
			};

			mapper
				.mapDefault()
				.map('lastName', 'surName')
				.map('dob', 'dateOfBirth')
				.map('manager', 'supervisor', managerMapper);
			expect(mapper.transform(user)).toEqual({
				firstName: 'Tuan',
				surName: 'Nguyen',
				dateOfBirth: '2020-04-30T00:00:00.000Z',
				supervisor: {
					familyName: 'Manager',
					givenName: 'My',
				},
			});
		});

		it('transform basic values', () => {
			const mapper = new Mapper(User);
			const user = new User();
			user.firstName = 'Tuan';
			user.lastName = 'Nguyen';
			user.password = 'abc';
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
			let result = mapper.mapDefault().transform(user);
			expect(result).toEqual({
				firstName: 'Tuan',
				friends: [
					{
						firstName: 'Hello',
						lastName: 'World',
					},
				],
				lastName: 'Nguyen',
				manager: {
					firstName: 'My',
					lastName: 'Manager',
				},
			});

			result = mapper.mapDefault().transform(user, {
				ignoreDecorators: true,
			});
			expect(result).toEqual({
				firstName: 'Tuan',
				friends: [
					{
						firstName: 'Hello',
						lastName: 'World',
						password: '123',
					},
				],
				lastName: 'Nguyen',
				manager: {
					firstName: 'My',
					lastName: 'Manager',
					password: '123',
				},
				password: 'abc',
			});
		});

		it('respect groups', () => {
			const mapper = new Mapper(User).mapDefault();
			const user = new User();
			user.secret = 'abc';
			user.firstName = 'Tuan';
			user.exclude = 'Exclude';

			expect(mapper.transform(user)).toEqual({
				firstName: 'Tuan',
				exclude: 'Exclude',
			});

			expect(
				mapper.transform(user, {
					groups: ['secret'],
				})
			).toEqual({
				firstName: 'Tuan',
				secret: 'abc',
			});
		});

		it('respect ignore groups', () => {
			const mapper = new Mapper(User).mapDefault();
			const user = new User();
			user.secret = 'abc';
			user.firstName = 'Tuan';
			user.exclude = 'Exclude';

			expect(
				mapper.transform(user, {
					ignoreGroups: true,
				})
			).toEqual({
				firstName: 'Tuan',
				exclude: 'Exclude',
				secret: 'abc',
			});
		});

		it('respect excludeIf in field options', () => {
			const mapper = new Mapper(User).mapDefault();
			const user = new User();
			user.excludeIf = 1;
			user.firstName = 'Tuan';

			expect(
				mapper.transform(user, {
					groups: ['excludeIf'],
				})
			).toEqual({
				firstName: 'Tuan',
			});

			user.excludeIf = 2;

			expect(
				mapper.transform(user, {
					groups: ['excludeIf'],
				})
			).toEqual({
				firstName: 'Tuan',
				excludeIf: 2,
			});
		});

		it('respect excludeIf in transform options', () => {
			const mapper = new Mapper(User).mapDefault();
			const user = new User();
			user.firstName = 'Tuan';
			user.lastName = 'Nguyen';
			user.city = 'Hanoi';

			expect(
				mapper.transform(user, {
					excludeIf(key, value) {
						return value === 'Nguyen' || key === 'city';
					},
				})
			).toEqual({
				firstName: 'Tuan',
			});
		});

		it('transform property value using transform options', () => {
			const mapper = new Mapper(User).mapDefault();
			const user = new User();
			user.excludeIf = 4;

			expect(
				mapper.transform(user, {
					transform: (key, value) =>
						key === 'excludeIf' ? value * 2 : value,
					groups: ['excludeIf'],
				})
			).toEqual({
				excludeIf: 8,
			});
		});
	});

	describe('transform to Class', () => {
		it('convert plain to class correctly', () => {
			const mapper = new Mapper(undefined, User).mapDefault();
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
			const user = mapper.transform(plainUser);
			expect(user).toBeInstanceOf(User);
			expect(user.friends[0]).toBeInstanceOf(User);
			expect(user.dob).toEqual(sampleDate);
			expect(JSON.stringify(user)).toEqual(JSON.stringify(plainUser));
		});

		it('respect alias', () => {
			const mapper = new Mapper(undefined, Book).mapDefault();
			const plainBook = {
				alias: 'My Book',
			};
			const book = mapper.transform(plainBook);
			expect(book).toBeInstanceOf(Book);
			expect(JSON.stringify(book)).toEqual(
				JSON.stringify({
					name: 'My Book',
					nameUpperCase: 'MY BOOK',
				})
			);
		});

		it('exclude properties', () => {
			const mapper = new Mapper(undefined, Book).mapDefault();
			const plainBook = {
				alias: 'My Book',
				isbn: '12345',
			};

			const book = mapper.transform(plainBook);
			expect(book).toBeInstanceOf(Book);
			expect(JSON.stringify(book)).toEqual(
				JSON.stringify({
					name: 'My Book',
					nameUpperCase: 'MY BOOK',
				})
			);
		});

		it('dynamic bindings', () => {
			const mapper = new Mapper(undefined, User);
			const user: any = {
				firstName: 'Tuan',
				surName: 'Nguyen',
				dateOfBirth: '2020-04-30T00:00:00.000Z',
				friends: [
					{
						givenName: 'Tuan',
						familyName: 'Nguyen',
					},
				],
			};

			const nestedMapper = new Mapper(undefined, User).mapDefault();
			nestedMapper.map('givenName', 'firstName');
			nestedMapper.map('familyName', 'lastName');
			user.supervisor = {
				givenName: 'Manager',
				familyName: 'My',
				password: '123',
			};

			mapper
				.mapDefault()
				.map('surName', 'lastName')
				.map('dateOfBirth', 'dob')
				.map('friends', 'friends', nestedMapper)
				.map('supervisor', 'manager', nestedMapper);

			const result = mapper.transform(user);
			expect(result).toBeInstanceOf(User);
			expect(result.manager).toBeInstanceOf(User);
			expect(result.friends[0]).toBeInstanceOf(User);
			expect(JSON.stringify(result)).toEqual(
				JSON.stringify({
					firstName: 'Tuan',
					lastName: 'Nguyen',
					dob: '2020-04-30T00:00:00.000Z',
					friends: [{ firstName: 'Tuan', lastName: 'Nguyen' }],
					manager: {
						firstName: 'Manager',
						lastName: 'My',
						password: '123',
					},
				})
			);
		});

		it('respect ignoreDecorators', () => {
			const mapper = new Mapper(undefined, Book).mapDefault();
			const plainBook = {
				alias: 'My Book',
				isbn: '12345',
			};

			const book = mapper.transform(plainBook, {
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

			const mapper = new Mapper(undefined, User).mapDefault();

			expect(
				JSON.stringify(
					mapper.transform(plainUser, {
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
					mapper.transform(plainUser, {
						groups: ['excludeIf'],
					})
				)
			).toEqual(
				JSON.stringify({
					excludeIf: 2,
					firstName: 'Tuan',
				})
			);
		});
	});

	describe('class to class transformation', () => {
		let custom = new Custom();
		custom.customName = 'customName';
		custom.name = 'Name';
		custom.number = 1;
		custom.inner = new Inner();
		custom.inner.a = 'a';
		custom.inner.b = 'b';

		const mapper = new Mapper(Custom, CustomDto).mapDefault();
		mapper.map('customName', 'customAlias');
		const innerMapper = mapper.getNestedMapper('inner');
		innerMapper.map('b', 'c');
		const customDto = mapper.transform(custom);
		expect(customDto).toBeInstanceOf(CustomDto);
		expect(customDto.inner).toBeInstanceOf(InnerDto);
		expect(customDto.number).toEqual(1);
		expect(JSON.stringify(customDto)).toEqual(
			JSON.stringify({
				customAlias: 'customName',
				alias: 'Name',
				_number: 1,
				inner: { a: 'a', c: 'b' },
			})
		);

		const inverseMapper = new Mapper(CustomDto, Custom).mapDefault();
		inverseMapper.map('customAlias', 'customName');
		const innerInverseMapper = inverseMapper.getNestedMapper('inner');
		innerInverseMapper.map('c', 'b');
		custom = inverseMapper.transform(customDto);

		expect(custom).toBeInstanceOf(Custom);
		expect(custom.inner).toBeInstanceOf(Inner);
		expect(JSON.stringify(custom)).toEqual(
			JSON.stringify({
				customName: 'customName',
				name: 'Name',
				number: 1,
				inner: { a: 'a', b: 'b' },
			})
		);
	});

	describe('getMapper', () => {
		const mapper = new Mapper(undefined, User).mapDefault();
		const innerMapper = mapper.getNestedMapper('manager.friends');
		expect(innerMapper).toBeDefined();
		expect(innerMapper).toEqual(mapper);
	});
});
