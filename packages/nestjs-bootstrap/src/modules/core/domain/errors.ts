import { ApiProperty } from '../decorators';
import { Error } from './error';

export class Errors {
	@ApiProperty()
	httpStatusCode!: number;

	@ApiProperty()
	traceId!: string;

	@ApiProperty()
	path!: string;

	@ApiProperty({
		type: Error,
	})
	errors!: Error[];
}
