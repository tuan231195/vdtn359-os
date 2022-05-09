import { Test, TestingModule } from '@nestjs/testing';
import { HelloController } from '../hello.controller';
import { HelloService } from '../hello.service';
import { TestCoreModule } from '../test-core.module';

describe('HelloController', () => {
	let helloController: HelloController;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [HelloController],
			providers: [HelloService],
			imports: [TestCoreModule],
		}).compile();

		helloController = app.get<HelloController>(HelloController);
	});

	describe('GET /', () => {
		it('should return "Hello World!"', () => {
			expect(helloController.getHello()).toBe('Hello World!');
		});
	});
});
