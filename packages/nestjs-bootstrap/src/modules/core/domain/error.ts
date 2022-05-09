import { ApiProperty, ApiPropertyOptional } from '../decorators';

export class Error {
	@ApiProperty()
	message!: string;

	@ApiProperty()
	code!: string;

	@ApiPropertyOptional()
	metadata?: Record<string, any>;
}
