import { DynamicModule, Module } from '@nestjs/common';
import { AsyncContextModule } from '@nestjs-steroids/async-context';
import { ContextInterceptor } from './middlewares';
import { axios, RequestLogger, RootLogger } from './services';
import { ValidationPipe } from './filters';
import { AXIOS_TOKEN, BOOTSTRAP_OPTIONS_TOKEN, CONFIG_TOKEN } from './tokens';
import { BootstrapOptions } from 'src/modules/core/interface';

@Module({})
export class CoreModule {
	static register(bootstrapOptions: BootstrapOptions): DynamicModule {
		return {
			module: CoreModule,
			global: true,
			exports: [
				CONFIG_TOKEN,
				AXIOS_TOKEN,
				BOOTSTRAP_OPTIONS_TOKEN,
				RootLogger,
				RequestLogger,
				ValidationPipe,
				ContextInterceptor,
			],
			providers: [
				{
					provide: AXIOS_TOKEN,
					useValue: axios,
				},
				{
					provide: CONFIG_TOKEN,
					useValue: bootstrapOptions.config,
				},
				{
					provide: BOOTSTRAP_OPTIONS_TOKEN,
					useValue: bootstrapOptions,
				},
				RootLogger,
				RequestLogger,
				ValidationPipe,
				ContextInterceptor,
			],
			imports: [AsyncContextModule.forRoot()],
		};
	}
}
