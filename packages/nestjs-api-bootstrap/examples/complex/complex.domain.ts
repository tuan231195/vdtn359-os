import { IsNotEmpty } from 'class-validator';
import {
	ApiProperty,
	ApiPropertyOptional,
	IsValidDateString,
	PartialType,
	RecordType,
	RequiredType,
} from 'src/modules/core';
import { getSchemaPath } from '@nestjs/swagger';

class CommonItem {
	@ApiProperty()
	@IsNotEmpty()
	name!: string;

	@ApiPropertyOptional({ format: 'date-time' })
	@IsValidDateString()
	dateTimeString?: string;

	@ApiPropertyOptional({ type: String })
	optionalString?: string;

	@ApiPropertyOptional({
		type: Boolean,
		format: 'date-time',
		nullable: false,
		default: true,
	})
	defaultBoolean: boolean;
}

export class UpdateItem extends PartialType(CommonItem) {}

export class ItemResponse extends RequiredType(CommonItem) {}

export class CreateItem extends CommonItem {
	constructor() {
		super();
		this.defaultBoolean = true;
	}
}

export class ItemList {
	@ApiProperty({
		type: 'object',
		additionalProperties: {
			oneOf: [{ $ref: getSchemaPath(CreateItem) }],
		},
	})
	@RecordType(CreateItem)
	map!: Map<string, CreateItem>;

	@ApiProperty({
		type: CreateItem,
		isArray: true,
	})
	array!: CreateItem[];
}
