import { Module, ModuleMetadata } from '@nestjs/common';
import { CoreModule } from './modules/core';
import { BootstrapOptions } from 'src/modules/core/interface';

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
		],
	});
}
