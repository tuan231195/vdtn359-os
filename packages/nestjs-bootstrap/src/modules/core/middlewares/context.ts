import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common';
import { AsyncContext } from '@nestjs-steroids/async-context';
import { v4 as uuidV4 } from 'uuid';
import { Observable } from 'rxjs';

export const TRACE_ID = 'x-sp-trace-id';

export type Context = {
	[TRACE_ID]: string;
};

@Injectable()
export class ContextInterceptor implements NestInterceptor {
	constructor(private readonly ac: AsyncContext<string, any>) {}

	intercept(context: ExecutionContext, next: CallHandler) {
		const req = context.switchToHttp().getRequest();
		const res = context.switchToHttp().getResponse();

		const traceId = req.headers[TRACE_ID] || uuidV4();
		req.headers[TRACE_ID] = traceId;
		res.header(TRACE_ID, traceId);

		return new Observable((subscriber) => {
			this.ac.registerCallback(() => {
				this.ac.set(TRACE_ID, traceId);
				next.handle()
					.pipe()
					.subscribe({
						complete: subscriber.complete.bind(subscriber),
						error: subscriber.error.bind(subscriber),
						next: subscriber.next.bind(subscriber),
					});
			});
		});
	}
}
