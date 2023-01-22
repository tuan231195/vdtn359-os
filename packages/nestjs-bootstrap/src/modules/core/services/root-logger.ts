import { Inject, Injectable } from '@nestjs/common';
import { BootstrapOptions } from 'src/modules/core/interface';
import { BOOTSTRAP_OPTIONS_TOKEN } from 'src/modules/core/tokens';
import pino from 'pino';
import serializers from 'pino-std-serializers';
import { DefaultLoggerService } from 'src/modules/core/services/default-logger-service';

@Injectable()
export class RootLogger extends DefaultLoggerService {
	constructor(
		@Inject(BOOTSTRAP_OPTIONS_TOKEN)
		private readonly bootstrapOptions: BootstrapOptions
	) {
		const isProd = process.env.NODE_ENV === 'production';
		const logger = pino({
			name: bootstrapOptions.name,
			version: bootstrapOptions.version,
			level: process.env.LOG_LEVEL ?? 'info',
			messageKey: 'message',
			paths: ['req.headers.authorization', "req.headers['x-api-key']"],
			serializers,
			formatters: {
				level: (label: string) => ({ level: label }),
			},
			...(!isProd && {
				transport: {
					target: 'pino-pretty',
					options: {
						colorize: true,
						messageKey: 'message',
					},
				},
			}),
		});
		super(logger);
	}

	get stream() {
		const { instance: rootLogger } = this;
		return {
			write(message: string) {
				rootLogger.info(message);
			},
		};
	}
}
