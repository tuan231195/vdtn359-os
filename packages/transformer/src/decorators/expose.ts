import 'reflect-metadata';
import { TransformOptions } from 'src/utils';

export const METADATA_KEY = '__TRANSFORMER_METADATA__';

export type ExposeOptions = {
	as?: string;
	type?: any;
	toClass?: boolean;
	toPlain?: boolean;
	groups?: string[];
	excludeIf?: (
		key: string,
		value?: any,
		exposeOptions?: ExposeOptions,
		transformOptions?: TransformOptions
	) => boolean;
};

export function ExposeAll(): ClassDecorator {
	return (target) => {
		const properties = (target as any).__PROPERTIES__ || [];
		if (properties.length) {
			const metadata = Reflect.getMetadata(METADATA_KEY, target);
			for (const property of properties) {
				if (!metadata.get(property)) {
					metadata.set(property, {
						...defaultOptions,
						type: Reflect.getMetadata(
							'design:type',
							target,
							property
						),
					});
				}
			}
		}
		return target;
	};
}

const defaultOptions: ExposeOptions = {
	toClass: true,
	toPlain: true,
};

export function Expose(options: ExposeOptions = {}): PropertyDecorator {
	options = { ...defaultOptions, ...options };
	return (target: Record<string, any>, property: string | symbol) => {
		if (typeof property !== 'string') {
			return;
		}
		const metadataTarget = target.constructor || target;
		if (!Reflect.hasOwnMetadata(METADATA_KEY, metadataTarget)) {
			Reflect.defineMetadata(
				METADATA_KEY,
				new Map<string, ExposeOptions>(),
				metadataTarget
			);
		}
		const metadata: Map<string, ExposeOptions> = Reflect.getMetadata(
			METADATA_KEY,
			metadataTarget
		);
		metadata.set(property, {
			...options,
			type:
				options.type ||
				Reflect.getMetadata('design:type', target, property),
			excludeIf: (key, value, exposeOptions, transformOptions = {}) => {
				const excludeIf = options.excludeIf || (() => false);
				let groupCondition = () => false;
				if (exposeOptions.groups && !transformOptions.ignoreGroups) {
					groupCondition = () =>
						exposeOptions.groups.every(
							(fieldGroup) =>
								!(transformOptions.groups || []).includes(
									fieldGroup
								)
						);
				}
				return (
					excludeIf(key, value, exposeOptions, transformOptions) ||
					groupCondition()
				);
			},
		});
		Reflect.defineMetadata(METADATA_KEY, metadata, metadataTarget);
	};
}
