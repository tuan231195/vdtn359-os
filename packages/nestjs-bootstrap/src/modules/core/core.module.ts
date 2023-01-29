import { DynamicModule, Module } from '@nestjs/common';
import { RequestLogger, RootLogger } from './services';
import { BOOTSTRAP_OPTIONS_TOKEN, CONFIG_TOKEN } from './tokens';
import { BootstrapOptions } from 'src/modules/core/interface';
import { AsyncContextModule } from '@nestjs-steroids/async-context';
@Module({})
export class CoreModule {
	static register(bootstrapOptions: BootstrapOptions): DynamicModule {
		return {
			module: CoreModule,
			global: true,
			exports: [
				CONFIG_TOKEN,
				BOOTSTRAP_OPTIONS_TOKEN,
				RootLogger,
				RequestLogger,
			],
			providers: [
				{
					provide: CONFIG_TOKEN,
					useFactory: () => {
						if (typeof bootstrapOptions.config === 'function') {
							return bootstrapOptions.config();
						}
						return bootstrapOptions.config;
					},
				},
				{
					provide: BOOTSTRAP_OPTIONS_TOKEN,
					useValue: bootstrapOptions,
				},
				RootLogger,
				RequestLogger,
			],
			imports: [AsyncContextModule.forRoot()],
		};
	}
}
