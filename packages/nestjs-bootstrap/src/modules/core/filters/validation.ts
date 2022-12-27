import {
	ArgumentMetadata,
	BadRequestException,
	Injectable,
	ParseBoolPipe,
	ParseIntPipe,
	PipeTransform,
	SetMetadata,
	ValidationPipe as BuiltinValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { merge, keyBy } from 'lodash';
import {
	ARRAY_NOT_EMPTY,
	IS_BIC,
	IS_BOOLEAN,
	IS_DATE,
	IS_DATE_STRING,
	IS_EMAIL,
	IS_IBAN,
	IS_INT,
	IS_NOT_EMPTY,
	IS_NUMBER,
	IS_URL,
	MAX,
	MAX_LENGTH,
	MIN,
	MIN_LENGTH,
	ValidationError,
	ValidatorOptions,
} from 'class-validator';
import { GenericErrorCodes } from '../domain';

const VALIDATE_OPTIONS = 'validationOptions';

const constraintToApiErrorCode: Record<string, GenericErrorCodes> = {
	[IS_EMAIL]: GenericErrorCodes.INVALID_EMAIL,
	[IS_INT]: GenericErrorCodes.INVALID_NUMBER,
	[IS_BOOLEAN]: GenericErrorCodes.INVALID_BOOLEAN,
	[MAX]: GenericErrorCodes.VALUE_TOO_BIG,
	[MIN]: GenericErrorCodes.VALUE_TOO_SMALL,
	[IS_URL]: GenericErrorCodes.INVALID_URL,
	[IS_IBAN]: GenericErrorCodes.INVALID_IBAN,
	[IS_BIC]: GenericErrorCodes.INVALID_BIC,
	[IS_NUMBER]: GenericErrorCodes.INVALID_NUMBER,
	[IS_DATE]: GenericErrorCodes.INVALID_DATE,
	[IS_DATE_STRING]: GenericErrorCodes.INVALID_DATE,
	[IS_NOT_EMPTY]: GenericErrorCodes.VALUE_REQUIRED,
	[ARRAY_NOT_EMPTY]: GenericErrorCodes.VALUE_REQUIRED,
	[MIN_LENGTH]: GenericErrorCodes.INVALID_LENGTH,
	[MAX_LENGTH]: GenericErrorCodes.INVALID_LENGTH,
};

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
	constructor(private reflector: Reflector) {}

	async transform(value: any, metadata: ArgumentMetadata) {
		const { metatype } = metadata;
		if (!metatype) {
			return value;
		}

		if (metatype === Number) {
			return new ParseIntPipe({
				exceptionFactory: (err) =>
					new BadRequestException({
						message: err,
						code: GenericErrorCodes.INVALID_NUMBER,
					}),
			}).transform(value, metadata);
		}

		if (metatype === Boolean) {
			return new ParseBoolPipe({
				exceptionFactory: (err) =>
					new BadRequestException({
						message: err,
						code: GenericErrorCodes.INVALID_BOOLEAN,
					}),
			}).transform(value, metadata);
		}

		const options =
			this.reflector.get<ValidatorOptions>(VALIDATE_OPTIONS, metatype) ||
			{};

		const validationPipe: any = new BuiltinValidationPipe(
			merge(
				{
					whitelist: true,
					transform: true,
					transformOptions: {
						exposeUnsetFields: false,
					},
					forbidNonWhitelisted: true,
					exceptionFactory: (
						validationErrors: ValidationError[] = []
					) =>
						new BadRequestException(
							ValidationPipe.transformValidationError(
								validationPipe,
								validationErrors
							)
						),
				},
				options
			)
		);
		return validationPipe.transform(value, metadata);
	}

	private static transformValidationError(
		validationPipe: any,
		validationErrors: ValidationError[]
	) {
		const errors = validationErrors
			.map((error) => validationPipe.mapChildrenToValidationErrors(error))
			.flat()
			.filter((item) => !!item.constraints)
			.map((item) =>
				Object.entries(item.constraints || {}).map(
					([constraint, message]) => ({
						message,
						path: item.property,
						code:
							constraintToApiErrorCode[constraint] ??
							GenericErrorCodes.INVALID_VALUE,
					})
				)
			)
			.flat();

		return Object.values(keyBy(errors, 'path'));
	}
}

/**
 * Allow setting custom ValidationOptions per domain model
 * @param validateOptions
 * usage:
 *
 * @ValidateOptions({ transform: false })
 * class CatDto {
 *
 * }
 */
export const ValidateOptions = (validateOptions: ValidatorOptions) =>
	SetMetadata(VALIDATE_OPTIONS, validateOptions);
