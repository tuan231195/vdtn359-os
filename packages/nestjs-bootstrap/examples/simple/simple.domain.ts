import { IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, IsValidDateString } from '../../src';

export class SimpleRequest {
	@ApiProperty()
	@IsNotEmpty()
	name!: string;

	@ApiPropertyOptional({ format: 'date-time' })
	@IsValidDateString()
	dateTimeString?: string;

	@ApiPropertyOptional({
		nullable: false,
		example: '01/01/2020',
		format: 'date',
	})
	@IsValidDateString('DD/MM/YYYY')
	dateString?: string;

	@ApiPropertyOptional({ type: Date })
	date?: Date;

	@ApiPropertyOptional({ type: Boolean })
	boolean?: boolean;

	@ApiPropertyOptional({ type: Number })
	number?: number;
}

export class SimpleResponse {
	@ApiProperty()
	message!: string;

	@ApiProperty()
	request!: any;
}
