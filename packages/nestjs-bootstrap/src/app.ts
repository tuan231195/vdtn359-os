import { INestApplication, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import morgan from 'morgan';

import {
	AllExceptionsFilter,
	BOOTSTRAP_OPTIONS_TOKEN,
	ContextInterceptor,
	RootLogger,
	TRACE_ID,
	ValidationPipe,
} from './modules/core';
import { BootstrapOptions, SwaggerOptions } from 'src/modules/core/interface';
import {
	FastifyAdapter,
	NestFastifyApplication,
} from '@nestjs/platform-fastify';

function setupSwagger({
	app,
	swagger,
	version,
}: {
	app: INestApplication;
	swagger?: SwaggerOptions;
	version: string;
}) {
	const config = new DocumentBuilder()
		.setTitle(swagger?.title ?? '')
		.setDescription(swagger?.description ?? '')
		.setVersion(version)
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('doc', app, document);
}

export const createApp = async (module: any) => {
	const app = await NestFactory.create<NestFastifyApplication>(
		module,
		new FastifyAdapter({ caseSensitive: false })
	);
	return setupApp(app);
};

export const setupApp = (app: INestApplication) => {
	const bootstrapOptions: BootstrapOptions = app.get(BOOTSTRAP_OPTIONS_TOKEN);
	const { swagger, version } = bootstrapOptions;

	// version must be loaded before swagger
	app.enableVersioning({
		type: VersioningType.URI,
	});

	setupSwagger({ app: app, swagger: swagger, version: version });

	const validationPipe = app.get(ValidationPipe);
	const contextInterceptor = app.get(ContextInterceptor);
	app.useGlobalPipes(validationPipe);
	app.useGlobalInterceptors(contextInterceptor);
	const adapterHost = app.get(HttpAdapterHost);
	const logger = app.get(RootLogger);
	app.useGlobalFilters(new AllExceptionsFilter(adapterHost, logger));

	app.use(
		morgan(
			(tokens, req, res) =>
				[
					tokens.method(req, res),
					tokens.url(req, res),
					tokens.status(req, res),
					tokens.res(req, res, 'content-length'),
					'-',
					tokens['response-time'](req, res),
					'ms',
					'- TraceId: ',
					tokens.res(req, res, TRACE_ID),
				].join(' '),
			{
				stream: logger.stream as any,
				skip(req) {
					return req.url === '/health';
				},
			}
		)
	);

	app.enableShutdownHooks();

	return app;
};
