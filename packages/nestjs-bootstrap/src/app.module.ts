import { Module, ModuleMetadata } from '@nestjs/common';
import { CoreModule } from './modules/core';
import { BootstrapOptions } from 'src/modules/core/interface';
import { HealthModule } from 'src/modules/health/health.module';

export function NestjsBootstrapModule(
	options: ModuleMetadata & {
		bootstrapOptions: BootstrapOptions;
	}
): ClassDecorator {
	const { bootstrapOptions, ...moduleOptions } = options;
	return Module({
		...moduleOptions,
		imports: [
			...(moduleOptions.imports ?? []),
			CoreModule.register(bootstrapOptions),
			HealthModule,
		],
	});
}
