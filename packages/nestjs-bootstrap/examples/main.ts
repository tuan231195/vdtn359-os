import 'reflect-metadata';
import { CONFIG_TOKEN, RootLogger, createApp } from '../src';
import { Config } from './config';
import { AppModule } from './app.module';

async function bootstrap() {
	const app = await createApp(AppModule);
	const config: Config = app.get(CONFIG_TOKEN);
	const rootLogger = app.get(RootLogger);
	rootLogger.info(`Config: ${config.toString()}`);
	await app.listen(config.get('PORT'), config.get('APP_HOST'));
}

bootstrap();
