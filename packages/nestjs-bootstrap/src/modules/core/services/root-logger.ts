import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { BootstrapOptions } from 'src/modules/core/interface';
import { BOOTSTRAP_OPTIONS_TOKEN } from 'src/modules/core/tokens';
import pino, { Logger } from 'pino';
import serializers from 'pino-std-serializers';

@Injectable()
export class RootLogger implements LoggerService {
	logger: Logger;

	constructor(
		@Inject(BOOTSTRAP_OPTIONS_TOKEN)
		private readonly bootstrapOptions: BootstrapOptions
	) {
		this.logger = pino({
			name: bootstrapOptions.name,
			version: bootstrapOptions.version,
			level: process.env.LOG_LEVEL ?? 'info',
			messageKey: 'message',
			paths: ['req.headers.authorization', "req.headers['x-api-key']"],
			serializers,
			formatters: {
				level: (label: string) => ({ level: label }),
			},
		});
	}
	info(message: any, ...optionalParams: any[]) {
		this.log(message, ...optionalParams);
	}

	child(options: object) {
		return this.logger.child(options);
	}

	/**
	 * Write a 'log' level log. equivalent to info
	 */
	log(message: any, ...optionalParams: any[]) {
		this.logger.info(message, ...optionalParams);
	}

	/**
	 * Write an 'error' level log.
	 */
	error(message: any, ...optionalParams: any[]) {
		this.logger.error(message, ...optionalParams);
	}

	/**
	 * Write a 'warn' level log.
	 */
	warn(message: any, ...optionalParams: any[]) {
		this.logger.warn(message, ...optionalParams);
	}

	/**
	 * Write a 'debug' level log.
	 */
	debug(message: any, ...optionalParams: any[]) {
		this.logger.debug(message, ...optionalParams);
	}

	/**
	 * Write a 'trace' level log.
	 */
	trace(message: any, ...optionalParams: any[]) {
		this.logger.trace(message, ...optionalParams);
	}

	get stream() {
		const { logger: rootLogger } = this;
		return {
			write(message: string) {
				rootLogger.info(message);
			},
		};
	}
}
