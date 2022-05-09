import { INestApplication } from '@nestjs/common';
import { createNestApplication } from '../util';
import request from 'supertest';

describe('AppController (e2e)', () => {
	let app: INestApplication;

	beforeAll(async () => {
		app = await createNestApplication();
	});

	afterAll(async () => {
		await app.close();
	});

	it('/v1 (GET)', () => {
		return request(app.getHttpServer())
			.get('/v1')
			.expect(200)
			.expect('Hello World!');
	});

	describe('/v1 (POST)', () => {
		it('should throw BadRequestException on missing name', async () => {
			const response = await request(app.getHttpServer())
				.post('/v1')
				.send({
					name: '',
				})
				.expect(400);

			expect(response.body).toEqual({
				httpStatusCode: 400,
				traceId: expect.any(String),
				path: '/v1',
				errors: [
					{
						message: 'name should not be empty',
						code: 'ValueRequired',
					},
				],
			});
		});

		it('should throw BadRequestException on redundant attribute', async () => {
			const response = await request(app.getHttpServer())
				.post('/v1')
				.send({
					name: 'test',
					blah: 'test',
				})
				.expect(400);

			expect(response.body).toEqual({
				httpStatusCode: 400,
				traceId: expect.any(String),
				path: '/v1',
				errors: [
					{
						message: 'property blah should not exist',
						code: 'InvalidValue',
					},
				],
			});
		});

		it('should throw BadRequestException on unknown name', async () => {
			const response = await request(app.getHttpServer())
				.post('/v1')
				.send({
					name: 'unknown',
				})
				.expect(400);

			expect(response.body).toEqual({
				httpStatusCode: 400,
				traceId: expect.any(String),
				path: '/v1',
				errors: [{ message: 'Unknown person', code: 'Unknown' }],
			});
		});

		it('should throw InternalServerError on error name', async () => {
			const response = await request(app.getHttpServer())
				.post('/v1')
				.send({
					name: 'error',
				})
				.expect(500);

			expect(response.body).toEqual({
				httpStatusCode: 500,
				traceId: expect.any(String),
				path: '/v1',
				errors: [
					{
						message: 'Internal Server Error',
						code: 'InternalServerError',
					},
				],
			});
		});

		it.each([
			['blah', 'blah'],
			['', ''],
			['2021-02-30T00:00:00Z', '30/02/2021'],
			['2021-02-30T00:00:00Z', '14-02-2021'],
		])(
			'should throw BadRequestException on invalid date/time',
			async (dateTime, date) => {
				const response = await request(app.getHttpServer())
					.post('/v1')
					.send({
						name: 'Test',
						dateTime,
						date,
					})
					.expect(400);

				expect(response.body).toEqual({
					httpStatusCode: 400,
					traceId: expect.any(String),
					path: '/v1',
					errors: [
						{
							code: 'InvalidDate',
							message:
								'dateTime must be a valid date of the format YYYY-MM-DD[T]HH:mm:ss[Z]',
						},
						{
							code: 'InvalidDate',
							message:
								'date must be a valid date of the format DD/MM/YYYY',
						},
					],
				});
			}
		);

		it('should return correct message', () => {
			return request(app.getHttpServer())
				.post('/v1')
				.send({
					name: 'Test',
					dateTime: '2021-01-01T00:00:00Z',
					date: '01/01/2021',
				})
				.expect(201)
				.expect('{"message":"Hello Test!"}');
		});
	});

	it('/health (GET)', () => {
		return request(app.getHttpServer())
			.get('/health')
			.expect(200)
			.expect('{"status":"ok","info":{},"error":{},"details":{}}');
	});
});
