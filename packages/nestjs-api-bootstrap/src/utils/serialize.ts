import {
	plainToClass,
	ClassTransformOptions,
	classToPlain,
} from 'class-transformer';

type Constructor<T> = new (...args: any[]) => T;

const defaultOptions: ClassTransformOptions = {
	excludeExtraneousValues: true,
	exposeUnsetFields: false,
};

/**
 * Convert a plain object to a class instance
 */
export const convertToInstance = <T>(
	classType: Constructor<T>,
	object: any,
	options: ClassTransformOptions = {}
) =>
	plainToClass(classType, object, {
		...defaultOptions,
		...options,
	});

/**
 * Convert a class instance to a plain object
 */
export const convertToPlain = <T>(
	object: T,
	options: ClassTransformOptions = {}
) =>
	classToPlain(object, {
		...defaultOptions,
		...options,
	});

/**
 * Convert a plain object to a class instance and then serialise the class instance to json object
 */
export const serialize = <T>(
	classType: Constructor<T>,
	object: any,
	options: ClassTransformOptions = {}
) => {
	return convertToPlain(
		convertToInstance(classType, object, options),
		options
	);
};
