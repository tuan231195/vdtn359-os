import {
	ArgumentsHost,
	Catch,
	ExceptionFilter,
	HttpException,
	HttpStatus,
} from '@nestjs/common';
import { AbstractHttpAdapter, HttpAdapterHost } from '@nestjs/core';
import { TRACE_ID } from '../middlewares';
import { RootLogger } from '../services';
import { GenericErrorCodes } from '../domain';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
	httpAdapter: AbstractHttpAdapter;

	constructor(
		httpAdapterHost: HttpAdapterHost,
		private readonly logger: RootLogger
	) {
		this.httpAdapter = httpAdapterHost.httpAdapter;
	}

	catch(exception: Error, host: ArgumentsHost): void {
		const { response } = AllExceptionsFilter.getRequestAndResponse(host);

		const responseBody = this.formatErrors(host, exception);
		const { httpStatusCode } = responseBody;

		const errorAttributes = {
			...responseBody,
			err: exception,
			'error.stack': exception.stack,
			'error.kind': exception.name,
			message: exception.message,
		};

		if (httpStatusCode >= 500) {
			this.logger.error(errorAttributes);
		} else {
			this.logger.warn(errorAttributes);
		}

		this.httpAdapter.reply(response, responseBody, httpStatusCode);
	}

	private static getRequestAndResponse(host: ArgumentsHost) {
		const context = host.switchToHttp();
		return {
			request: context.getRequest(),
			response: context.getResponse(),
		};
	}

	private formatErrors(host: ArgumentsHost, exception: any) {
		const { request } = AllExceptionsFilter.getRequestAndResponse(host);

		const httpStatus =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR;

		const message =
			httpStatus === HttpStatus.INTERNAL_SERVER_ERROR
				? 'Internal Server Error'
				: exception.message;

		let errors =
			exception instanceof HttpException
				? exception.getResponse()
				: message;
		if (typeof errors === 'object') {
			if (typeof errors.message === 'object') {
				errors = errors.message;
			}
		} else {
			errors = { message, code: GenericErrorCodes.INTERNAL_SERVER_ERROR };
		}

		if (!Array.isArray(errors)) {
			errors = [errors];
		}

		errors = errors.map((err: any) => {
			const code = err.code ?? GenericErrorCodes.INTERNAL_SERVER_ERROR;
			return {
				...err,
				message: err.message ?? message,
				code,
			};
		});

		return {
			httpStatusCode: httpStatus,
			traceId: request.headers[TRACE_ID],
			path: this.httpAdapter.getRequestUrl(request),
			errors,
		};
	}
}
