import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { logger } from './logger';
import { Logger } from 'winston';
import { BootstrapOptions } from 'src/modules/core/interface';
import { BOOTSTRAP_OPTIONS_TOKEN } from 'src/modules/core/tokens';

@Injectable()
export class RootLogger implements LoggerService {
	private logger: Logger;

	constructor(
		@Inject(BOOTSTRAP_OPTIONS_TOKEN)
		private readonly bootstrapOptions: BootstrapOptions
	) {
		this.logger = logger.child({
			name: bootstrapOptions.name,
			version: bootstrapOptions.version,
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
	 * Write a 'verbose' level log.
	 */
	verbose(message: any, ...optionalParams: any[]) {
		this.logger.verbose(message, ...optionalParams);
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
