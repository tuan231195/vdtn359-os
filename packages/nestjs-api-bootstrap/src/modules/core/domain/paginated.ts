import {
	ApiResponseOptions,
	ApiOkResponse,
	getSchemaPath,
	ApiExtraModels,
} from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '../decorators';

export class Paginated<T> {
	@ApiProperty()
	items!: T[];

	@ApiProperty({ default: 0 })
	page!: number;

	@ApiProperty({ default: 10 })
	size!: number;

	@ApiProperty()
	total!: number;

	@ApiProperty()
	hasMore!: boolean;
}

export class PaginatedQuery {
	@Type(() => Number)
	@Min(0)
	@IsInt()
	@ApiPropertyOptional({ default: 0, type: Number })
	page = 0;

	@Type(() => Number)
	@Min(1)
	@Max(50)
	@IsInt()
	@ApiPropertyOptional({ default: 10, type: Number })
	size = 10;

	@ApiPropertyOptional({ default: 'id', type: String })
	@IsString()
	@IsNotEmpty()
	orderBy = 'id';
}

export const ApiPaginatedResponse = (
	options: ApiResponseOptions & { response: any }
) =>
	applyDecorators(
		ApiExtraModels(Paginated, options.response),
		ApiOkResponse({
			description: options.description,
			schema: {
				allOf: [
					{ $ref: getSchemaPath(Paginated) },
					{
						properties: {
							items: {
								type: 'array',
								items: {
									$ref: getSchemaPath(options.response),
								},
							},
						},
					},
				],
			},
		})
	);
