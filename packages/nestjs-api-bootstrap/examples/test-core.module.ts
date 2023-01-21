import { Module } from '@nestjs/common';
import { RequestLogger, RootLogger } from '../src';

const mockLogger = () => ({
	verbose: jest.fn(),
	debug: jest.fn(),
	log: jest.fn(),
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
});

@Module({
	providers: [
		{
			provide: RequestLogger,
			useValue: mockLogger(),
		},
		{
			provide: RootLogger,
			useValue: mockLogger(),
		},
	],
	exports: [RequestLogger, RootLogger],
})
export class TestCoreModule {}
