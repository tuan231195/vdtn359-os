import { Expose } from 'src/decorators';
import { Exclude } from 'src/decorators/exclude';

export class Book {
	constructor({ alias }) {
		this.name = alias;
		this.nameUpperCase = alias.toUpperCase();
	}

	@Expose({
		as: 'alias',
	})
	name: string;

	nameUpperCase: string;

	@Exclude()
	isbn: string;
}
