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
import { merge } from 'lodash';
import {
	ARRAY_NOT_EMPTY,
	IS_BIC,
	IS_BOOLEAN,
	IS_DATE,
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
	[IS_EMAIL]: GenericErrorCodes.InvalidEmail,
	[IS_INT]: GenericErrorCodes.InvalidNumber,
	[IS_BOOLEAN]: GenericErrorCodes.InvalidBoolean,
	[MAX]: GenericErrorCodes.ValueTooBig,
	[MIN]: GenericErrorCodes.ValueTooSmall,
	[IS_URL]: GenericErrorCodes.InvalidURL,
	[IS_IBAN]: GenericErrorCodes.InvalidIban,
	[IS_BIC]: GenericErrorCodes.InvalidBIC,
	[IS_NUMBER]: GenericErrorCodes.InvalidNumber,
	[IS_DATE]: GenericErrorCodes.InvalidDate,
	[IS_NOT_EMPTY]: GenericErrorCodes.ValueRequired,
	[ARRAY_NOT_EMPTY]: GenericErrorCodes.ValueRequired,
	[MIN_LENGTH]: GenericErrorCodes.InvalidLength,
	[MAX_LENGTH]: GenericErrorCodes.InvalidLength,
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
						code: GenericErrorCodes.InvalidNumber,
					}),
			}).transform(value, metadata);
		}

		if (metatype === Boolean) {
			return new ParseBoolPipe({
				exceptionFactory: (err) =>
					new BadRequestException({
						message: err,
						code: GenericErrorCodes.InvalidBoolean,
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
		return validationErrors
			.map((error) => validationPipe.mapChildrenToValidationErrors(error))
			.flat()
			.filter((item) => !!item.constraints)
			.map((item) =>
				Object.entries(item.constraints || {}).map(
					([constraint, message]) => ({
						message,
						code:
							constraintToApiErrorCode[constraint] ??
							GenericErrorCodes.InvalidValue,
					})
				)
			)
			.flat();
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
