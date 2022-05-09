import { IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional, IsValidDate } from '../src';

export class HelloRequest {
	@ApiProperty()
	@IsNotEmpty()
	name!: string;

	@ApiPropertyOptional()
	@IsValidDate()
	dateTime?: string;

	@ApiPropertyOptional()
	@IsValidDate('DD/MM/YYYY')
	date?: string;
}

export class HelloResponse {
	@ApiProperty()
	message!: string;
}
