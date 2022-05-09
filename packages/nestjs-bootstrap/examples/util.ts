import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { RequestMethod } from '@nestjs/common';
import { setupApp } from '../src';
import { AppModule } from './app.module';

export const createNestApplication = async () => {
	const moduleFixture: TestingModule = await Test.createTestingModule({
		imports: [AppModule],
	}).compile();

	const adapter = new FastifyAdapter();
	await adapter.createMiddlewareFactory(RequestMethod.ALL);

	const app = await setupApp(moduleFixture.createNestApplication(adapter));

	await app.init();
	await app.getHttpAdapter().getInstance().ready();
	return app;
};
