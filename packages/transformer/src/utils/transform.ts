import { getMetadata } from 'src/utils/metadata';
import { ExposeOptions } from 'src/decorators';

export type TransformOptions = {
	ignoreDecorators?: boolean;
	ignoreGroups?: true;
	excludeIf?: (
		key,
		value,
		exposeOptions: ExposeOptions,
		transformOptions: TransformOptions
	) => boolean;
	transform?: (key, value) => any;
	transformDate?: boolean;
	groups?: string[];
};

export const defaultTransformOptions: TransformOptions = {
	transformDate: true,
	ignoreDecorators: false,
};

export enum TransformType {
	TO_PLAIN,
	TO_CLASS,
}

export function toPlain(
	object,
	constructor = getConstructorFromObject(object),
	transformOptions: TransformOptions = {}
) {
	transformOptions = { ...defaultTransformOptions, ...transformOptions };
	if (!object || typeof object !== 'object') {
		return object;
	}
	if (Array.isArray(object)) {
		return object.map((element) =>
			toPlain(element, constructor, transformOptions)
		);
	}
	if (object instanceof Date) {
		return transformOptions.transformDate ? object.toJSON() : object;
	}
	const metadata = getMetadata(constructor) || new Map();
	const result = {};
	for (const [key, value] of Object.entries(object)) {
		if (
			!shouldExpose({
				key,
				value,
				metadata,
				transformOptions,
				transformType: TransformType.TO_PLAIN,
			})
		) {
			continue;
		}
		const exposeOptions = metadata.get(key) || {};
		const transform = transformOptions.transform
			? transformOptions.transform
			: (key, value) => value;
		const as = exposeOptions.as || key;
		result[as] =
			value && typeof value === 'object'
				? toPlain(value, exposeOptions.type, transformOptions)
				: value;
		result[as] = transform(as, result[as]);
	}
	return result;
}

export function toClass(
	plainObject,
	Class,
	transformOptions: TransformOptions = {}
): typeof Class {
	transformOptions = { ...defaultTransformOptions, ...transformOptions };
	if (Class === Date) {
		return transformOptions.transformDate
			? new Date(plainObject)
			: plainObject;
	}
	if (Array.isArray(plainObject)) {
		return plainObject.map((element) =>
			toClass(element, Class, transformOptions)
		);
	}
	if (typeof plainObject !== 'object') {
		return plainObject;
	}
	const metadata = getMetadata(getConstructorFromClass(Class)) || new Map();
	const result = Class.length ? new Class(plainObject) : new Class();
	for (const [key, exposeOptions] of metadata.entries()) {
		const as = exposeOptions.as || key;
		if (
			!shouldExpose({
				key,
				value: plainObject[as],
				metadata,
				transformOptions,
				transformType: TransformType.TO_CLASS,
			})
		) {
			continue;
		}

		if (!result[key] && plainObject[as]) {
			const value = plainObject[as];
			const transform: any = transformOptions.transform
				? transformOptions.transform
				: (key, value) => value;
			result[key] = value ? toClass(value, exposeOptions.type) : value;
			result[key] = transform(key, result[key], exposeOptions);
		}
	}
	return result;
}

export function shouldExpose({
	key,
	value,
	transformOptions,
	metadata,
	transformType,
}: {
	key: string;
	value: any;
	metadata: Map<string, ExposeOptions>;
	transformOptions: TransformOptions;
	transformType: TransformType;
}) {
	const exposeOptions = metadata?.get(key);
	if (
		transformOptions.excludeIf &&
		transformOptions.excludeIf(key, value, exposeOptions, transformOptions)
	) {
		return false;
	}
	if (transformOptions.ignoreDecorators) {
		return true;
	}
	if (!exposeOptions) {
		return false;
	}
	if (
		exposeOptions.excludeIf &&
		exposeOptions.excludeIf(key, value, exposeOptions, transformOptions)
	) {
		return false;
	}
	if (transformType === TransformType.TO_CLASS && !exposeOptions.toClass) {
		return false;
	}
	return !(
		transformType === TransformType.TO_PLAIN && !exposeOptions.toPlain
	);
}

function getConstructorFromClass(object) {
	return object.prototype.constructor || object;
}

function getConstructorFromObject(object) {
	const prototype = Object.getPrototypeOf(object);
	return prototype.constructor;
}
