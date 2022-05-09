import {
	MAX,
	MIN,
	IS_DATE,
	ValidateBy,
	ValidateIf,
	IsNotIn,
} from 'class-validator';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { applyDecorators } from '@nestjs/common';

dayjs.extend(customParseFormat);

const parseNumber = (value: number | string) => {
	let number: number;
	if (typeof value === 'string') {
		number = parseFloat(value);
	} else {
		number = value;
	}
	return number;
};

export const Max = (max: number) =>
	ValidateBy({
		name: MAX,
		constraints: [max],
		validator: {
			validate(value: number | string) {
				const number = parseNumber(value);

				if (Number.isNaN(number)) {
					return false;
				}

				return number <= max;
			},
			defaultMessage() {
				return '$property must not be greater than $constraint1';
			},
		},
	});

export const Min = (min: number) =>
	ValidateBy({
		name: MIN,
		constraints: [min],
		validator: {
			validate(value: number | string) {
				const number = parseNumber(value);

				if (Number.isNaN(number)) {
					return false;
				}

				return number >= min;
			},
			defaultMessage() {
				return '$property must not be less than $constraint1';
			},
		},
	});

export const IsNotNull = () =>
	applyDecorators(
		IsNotIn([null], {
			message: '$property must not be null',
		})
	);

export const IsNotNullAndOptional = () =>
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

export const IsValidDate = (format = 'YYYY-MM-DD[T]HH:mm:ss[Z]') =>
	ValidateBy({
		name: IS_DATE,
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
