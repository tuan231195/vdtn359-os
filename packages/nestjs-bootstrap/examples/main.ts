import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { CONFIG_TOKEN, RootLogger, setupApp } from '../src';
import {
	FastifyAdapter,
	NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { Config } from './config';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter({ caseSensitive: false })
	);
	await setupApp(app);
	const config: Config = app.get(CONFIG_TOKEN);
	const rootLogger = app.get(RootLogger);
	rootLogger.info(`Config: ${config.toString()}`);
	await app.listen(config.get('PORT'), config.get('APP_HOST'));
}

bootstrap();
