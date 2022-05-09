import { plainToClass, ClassTransformOptions } from 'class-transformer';

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
