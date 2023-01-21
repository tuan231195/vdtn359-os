import { Body, Controller, Post, Put } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Errors, RequestLogger } from '../../src';
import { ItemList, UpdateItem } from './complex.domain';

@ApiTags('Complex')
@Controller({
	version: '2',
})
export class ComplexController {
	constructor(private readonly logger: RequestLogger) {}

	@Post()
	@ApiOkResponse({
		description: 'Request successfully',
	})
	@ApiBadRequestResponse({
		description: 'Bad request',
		type: Errors,
	})
	postList(@Body() itemList: ItemList) {
		return itemList;
	}

	@Put()
	@ApiOkResponse({
		description: 'Request successfully',
	})
	@ApiBadRequestResponse({
		description: 'Bad request',
		type: Errors,
	})
	putItem(@Body() updateItem: UpdateItem) {
		return updateItem;
	}
}
