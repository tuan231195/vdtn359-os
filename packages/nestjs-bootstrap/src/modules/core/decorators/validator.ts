import {
	IsNotIn,
	ValidateBy,
	ValidateIf,
	IS_DATE_STRING,
} from 'class-validator';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { applyDecorators } from '@nestjs/common';

dayjs.extend(customParseFormat);

export const IsNotNull = () =>
	applyDecorators(
		IsNotIn([null], {
			message: '$property must not be null',
		})
	);

export const OptionalNotNullable = () =>
	applyDecorators(
		ValidateIf((object, value) => value !== undefined),
		IsNotNull()
	);

export const IsDefined = () =>
	applyDecorators(
		IsNotIn([undefined], {
			message: '$property must be defined',
		})
	);

export const IsValidDateString = (format = 'YYYY-MM-DD[T]HH:mm:ss[Z]') =>
	ValidateBy({
		name: IS_DATE_STRING,
		validator: {
			validate(value: string | Date) {
				if (value instanceof Date) {
					return !Number.isNaN(value.getTime());
				}

				if (typeof value !== 'string') {
					return false;
				}

				return dayjs(value, format, true).isValid();
			},
			defaultMessage() {
				return `$property must be a valid date of the format ${format}`;
			},
		},
	});
