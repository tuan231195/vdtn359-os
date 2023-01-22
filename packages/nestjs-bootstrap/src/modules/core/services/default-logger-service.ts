import { LoggerService } from '@nestjs/common';
import { Logger } from 'pino';

export class DefaultLoggerService implements LoggerService {
	constructor(private readonly defaultLogger: Logger | (() => Logger)) {}

	get instance() {
		if (typeof this.defaultLogger === 'function') {
			return this.defaultLogger();
		}
		return this.defaultLogger;
	}

	private logMessage(level: string, message: any, ...optionalParams: any[]) {
		if (optionalParams[0] && typeof optionalParams[0] === 'object') {
			return this.instance[level](optionalParams[0], message);
		}

		return this.instance[level](message, ...optionalParams);
	}

	child(options: object) {
		return new DefaultLoggerService(this.instance.child(options));
	}
	error(message: any, ...optionalParams: any[]): any {
		this.logMessage('error', message, ...optionalParams);
	}

	log(message: any, ...optionalParams: any[]): any {
		this.logMessage('info', message, ...optionalParams);
	}

	info(message: any, ...optionalParams: any[]): any {
		this.logMessage('info', message, ...optionalParams);
	}

	debug(message: any, ...optionalParams: any[]): any {
		this.logMessage('debug', message, ...optionalParams);
	}

	trace(message: any, ...optionalParams: any[]): any {
		this.logMessage('trace', message, ...optionalParams);
	}

	warn(message: any, ...optionalParams: any[]): any {
		this.logMessage('warn', message, ...optionalParams);
	}
}
