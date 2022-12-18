import {
	BadRequestException,
	Body,
	Controller,
	Get,
	Post,
} from '@nestjs/common';
import {
	ApiBadRequestResponse,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from '@nestjs/swagger';
import { HelloService } from '../hello.service';
import { SimpleRequest, SimpleResponse } from './simple.domain';
import { Errors, RequestLogger } from '../../src';
import { serialize } from 'src/utils';

@ApiTags('Simple')
@Controller({
	version: '1',
})
export class SimpleController {
	constructor(
		private readonly helloService: HelloService,
		private readonly logger: RequestLogger
	) {}

	@Get()
	getHello(): string {
		this.logger.info('Getting message');
		return this.helloService.getHello();
	}

	@Post()
	@ApiOperation({ description: 'Hello someone' })
	@ApiOkResponse({
		description: 'Hello successfully',
		type: SimpleResponse,
	})
	@ApiBadRequestResponse({
		description: 'Bad request',
		type: Errors,
	})
	postHello(@Body() simpleRequest: SimpleRequest) {
		const { name } = simpleRequest;
		this.logger.info(`Hello ${name}`, simpleRequest);

		if (name === 'unknown') {
			throw new BadRequestException({
				message: 'Unknown person',
				code: 'Unknown',
			});
		}
		if (name === 'error') {
			throw new Error('Unknown person');
		}
		const message = this.helloService.postHello(name);

		return serialize(SimpleResponse, {
			message,
			request: simpleRequest,
		});
	}
}
