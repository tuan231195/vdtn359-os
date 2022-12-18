import { Transform, Type } from 'class-transformer';
import { applyDecorators } from '@nestjs/common';
import { ValidateNested } from 'class-validator';

export const ToFixed = (precision = 2) =>
	Transform(({ value }) =>
		typeof value === 'number' ? value.toFixed(precision) : value
	);

export const ToUpperCase = () =>
	Transform(({ value }) =>
		typeof value === 'string' ? value.toUpperCase() : value
	);

export const ToLowerCase = () =>
	Transform(({ value }) =>
		typeof value === 'string' ? value.toLowerCase() : value
	);

export const TypeBoolean = () =>
	Transform(({ value }) => value && value !== 'false');

export const RecordType = (valueType: any) =>
	applyDecorators(
		Type(() => valueType),
		ValidateNested({ each: true })
	);
