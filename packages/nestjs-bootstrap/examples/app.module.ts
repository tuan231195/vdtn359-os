import 'reflect-metadata';
import { NestjsBootstrapModule } from '../src';
import { config } from './config';
import { HelloController } from './hello.controller';
import { HelloService } from './hello.service';

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
	controllers: [HelloController],
	providers: [HelloService],
})
export class AppModule {}
