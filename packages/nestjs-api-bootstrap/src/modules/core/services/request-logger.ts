import { Injectable } from '@nestjs/common';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { RootLogger } from './root-logger';
import { TRACE_ID } from 'src/modules/core';
import { DefaultLoggerService } from 'src/modules/core/services/default-logger-service';

@Injectable()
export class RequestLogger extends DefaultLoggerService {
	constructor(
		private readonly ac: AsyncContext<string, any>,
		private readonly rootLogger: RootLogger
	) {
		super(() => {
			let traceId = '';
			try {
				traceId = this.ac.get(TRACE_ID);
			} catch (err) {
				this.rootLogger.warn('Async context not available');
			}

			return this.rootLogger.instance.child({
				traceId,
			});
		});
	}
}
