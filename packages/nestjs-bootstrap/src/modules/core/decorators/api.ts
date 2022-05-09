import { applyDecorators } from '@nestjs/common';
import {
	ApiProperty as SwaggerAPIProperty,
	ApiPropertyOptional as SwaggerAPIPropertyOptional,
	ApiPropertyOptions,
} from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { IsDefined, IsNotNull, IsNotNullAndOptional } from './validator';

export * from '@nestjs/swagger';

export const ApiProperty = (
	args?: ApiPropertyOptions & { disableDefaultValidation?: boolean }
) => {
	const validationDisabled = args?.disableDefaultValidation ?? false;
	const nullable = args?.nullable ?? false;

	const decorators = [
		Expose(),
		IsDefined(),
		SwaggerAPIProperty({ required: true, nullable, ...args }),
	];

	if (!nullable && !validationDisabled) {
		decorators.push(IsNotNull());
	}

	return applyDecorators(...decorators);
};

export const ApiPropertyOptional = (
	args: ApiPropertyOptions & { disableDefaultValidation?: boolean } = {}
) => {
	const validationDisabled = args?.disableDefaultValidation ?? false;
	const nullable = args.nullable ?? true;

	const decorators = [
		Expose(),
		SwaggerAPIPropertyOptional({ required: false, nullable, ...args }),
	];

	if (!validationDisabled) {
		decorators.push(nullable ? IsOptional() : IsNotNullAndOptional());
	}

	return applyDecorators(...decorators);
};
