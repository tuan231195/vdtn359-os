import { INestApplication, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpAdapterHost } from '@nestjs/core';
import morgan from 'morgan';

import {
	AllExceptionsFilter,
	ValidationPipe,
	RootLogger,
	TRACE_ID,
	ContextInterceptor,
	BOOTSTRAP_OPTIONS_TOKEN,
} from './modules/core';
import { BootstrapOptions } from 'src/modules/core/interface';

export const setupApp = async (app: INestApplication) => {
	const bootstrapOptions: BootstrapOptions = app.get(BOOTSTRAP_OPTIONS_TOKEN);
	const { swagger, version } = bootstrapOptions;

	// version must be loaded before swagger
	app.enableVersioning({
		type: VersioningType.URI,
	});

	const config = new DocumentBuilder()
		.setTitle(swagger?.title ?? '')
		.setDescription(swagger?.description ?? '')
		.setVersion(version)
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('doc', app, document);

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
