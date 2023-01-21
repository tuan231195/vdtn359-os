import 'reflect-metadata';
import { NestjsBootstrapModule } from '../src';
import { config } from './config';
import { SimpleController } from './simple/simple.controller';
import { HelloService } from './hello.service';
import { ComplexController } from './complex/complex.controller';

@NestjsBootstrapModule({
	bootstrapOptions: {
		swagger: {
			title: 'Test application',
			description: 'Test description',
		},
		version: '0.0.1',
		name: 'application-name',
		config,
	},
	controllers: [SimpleController, ComplexController],
	providers: [HelloService],
})
export class AppModule {}
