import { Transform } from 'class-transformer';

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
