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
import { HelloService } from './hello.service';
import { HelloRequest, HelloResponse } from './hello.domain';
import { convertToInstance, RequestLogger, Errors } from '../src';

@ApiTags('Hello')
@Controller({
	version: '1',
})
export class HelloController {
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
		type: HelloResponse,
	})
	@ApiBadRequestResponse({
		description: 'Bad request',
		type: Errors,
	})
	postHello(@Body() helloRequest: HelloRequest): HelloResponse {
		const { name } = helloRequest;
		this.logger.info(`Hello ${name}`);

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

		return convertToInstance(HelloResponse, {
			message,
		});
	}
}
