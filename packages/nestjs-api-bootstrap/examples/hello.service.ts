import { Injectable } from '@nestjs/common';

@Injectable()
export class HelloService {
	// eslint-disable-next-line class-methods-use-this
	getHello(): string {
		return 'Hello World!';
	}

	postHello(name: string) {
		return `Hello ${name}!`;
	}
}
