import { applyDecorators, Type as Constructor } from '@nestjs/common';
import {
	ApiProperty as SwaggerAPIProperty,
	ApiPropertyOptional as SwaggerAPIPropertyOptional,
	ApiPropertyOptions,
} from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
	IsDate,
	IsNumber,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';
import { IsDefined, IsNotNull, OptionalNotNullable } from './validator';
import { TypeBoolean } from 'src/modules/core';
import { ModelPropertiesAccessor } from '@nestjs/swagger/dist/services/model-properties-accessor';
import {
	inheritPropertyInitializers,
	inheritTransformationMetadata,
	inheritValidationMetadata,
} from '@nestjs/mapped-types';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { METADATA_FACTORY_NAME } from '@nestjs/swagger/dist/plugin/plugin-constants';
import { OptionalToNullable } from 'src/utils/types';

export * from '@nestjs/swagger';

function getAdditionalDecorators(options?: ApiPropertyOptions) {
	const additionalDecorators: PropertyDecorator[] = [Expose()];
	if (options?.type) {
		const { type } = options as any;
		if (type === Boolean) {
			additionalDecorators.push(TypeBoolean());
		} else if (type === Number) {
			additionalDecorators.push(IsNumber());
		} else if (type === Date) {
			additionalDecorators.push(
				Type(() => type),
				IsDate()
			);
		} else if (type === String) {
			additionalDecorators.push(
				Type(() => type),
				IsString()
			);
		} else if (typeof type === 'function') {
			if (options.isArray) {
				additionalDecorators.push(
					ValidateNested({ each: true }),
					Type(() => type as any)
				);
			} else {
				additionalDecorators.push(
					ValidateNested(),
					Type(() => type)
				);
			}
		}
	}
	return additionalDecorators;
}

export const ApiProperty = (args?: ApiPropertyOptions) => {
	const nullable = args?.nullable ?? false;

	const decorators = [
		Expose(),
		IsDefined(),
		SwaggerAPIProperty({ required: true, nullable, ...args }),
		...getAdditionalDecorators(args),
	];

	if (!nullable) {
		decorators.push(IsNotNull());
	}

	return applyDecorators(...decorators);
};

export const ApiPropertyOptional = (
	args?: ApiPropertyOptions & { disableDefaultValidation?: boolean }
) => {
	const nullable = args?.nullable ?? true;

	const decorators = [
		Expose(),
		SwaggerAPIPropertyOptional({ required: false, nullable, ...args }),
		...getAdditionalDecorators(args),
	];
	if (args?.disableDefaultValidation) {
		decorators.push(nullable ? IsOptional() : OptionalNotNullable());
	}
	return applyDecorators(...decorators);
};

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export interface FieldConfig {
	required?: boolean;
}

function TypeBuilder<T, K extends keyof T>(
	classRef: Constructor<T>,
	overrides?: Record<K, FieldConfig>
): any {
	const fields = modelPropertiesAccessor.getModelProperties(
		classRef.prototype
	);

	abstract class ModifiedTypeClass {
		constructor() {
			inheritPropertyInitializers(this, classRef);
		}
	}

	function applyDecorator(key: string, metadata?: any) {
		const config: FieldConfig | undefined =
			overrides != null ? overrides[key] : undefined;

		const required = config?.required ?? metadata?.required ?? true;
		const nullable = metadata?.nullable ?? true;

		const decorators = [
			SwaggerAPIProperty({
				...metadata,
				required,
				nullable,
			}),
		];

		if (nullable) {
			decorators.push(IsOptional());
		} else {
			decorators.push(OptionalNotNullable());
		}

		const decorator = applyDecorators(...decorators);

		decorator(ModifiedTypeClass.prototype, key);
	}

	inheritValidationMetadata(classRef, ModifiedTypeClass);
	inheritTransformationMetadata(classRef, ModifiedTypeClass);

	fields.forEach((key) => {
		const metadata =
			Reflect.getMetadata(
				DECORATORS.API_MODEL_PROPERTIES,
				classRef.prototype,
				key
			) || {};

		applyDecorator(key, metadata);
	});

	if (ModifiedTypeClass[METADATA_FACTORY_NAME]) {
		const pluginFields = Object.keys(
			ModifiedTypeClass[METADATA_FACTORY_NAME]()
		);
		pluginFields.forEach((key) => applyDecorator(key));
	}

	return ModifiedTypeClass as Constructor<Partial<T>>;
}

export const PartialType = <T>(
	classRef: Constructor<T>
): Constructor<Partial<T>> => {
	const fields = modelPropertiesAccessor.getModelProperties(
		classRef.prototype
	);

	const fieldConfigs = fields.reduce((agg, key) => {
		const metadata =
			Reflect.getMetadata(
				DECORATORS.API_MODEL_PROPERTIES,
				classRef.prototype,
				key
			) || {};

		const fieldConfig = {
			nullable: metadata?.nullable,
			required: false,
		};

		return {
			...agg,
			[key]: fieldConfig,
		};
	}, {} as Record<keyof T, FieldConfig>);

	return TypeBuilder(classRef, fieldConfigs);
};

export const RequiredType = <T extends object>(
	classRef: Constructor<T>
): Constructor<OptionalToNullable<T>> => {
	const fields = modelPropertiesAccessor.getModelProperties(
		classRef.prototype
	);

	const fieldConfigs = fields.reduce((agg, key) => {
		const metadata =
			Reflect.getMetadata(
				DECORATORS.API_MODEL_PROPERTIES,
				classRef.prototype,
				key
			) || {};

		const fieldConfig = {
			nullable: metadata.nullable || metadata.default != null,
			required: true,
		};

		return {
			...agg,
			[key]: fieldConfig,
		};
	}, {} as Record<keyof T, FieldConfig>);

	return TypeBuilder(classRef, fieldConfigs);
};
