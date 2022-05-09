import { ModelPropertiesAccessor } from '@nestjs/swagger/dist/services/model-properties-accessor';
import { applyDecorators, Type } from '@nestjs/common';
import {
	inheritPropertyInitializers,
	inheritTransformationMetadata,
	inheritValidationMetadata,
} from '@nestjs/mapped-types';
import { IsOptional } from 'class-validator';
import { DECORATORS } from '@nestjs/swagger/dist/constants';
import { METADATA_FACTORY_NAME } from '@nestjs/swagger/dist/plugin/plugin-constants';
import { ApiProperty as SwaggerAPIProperty } from '@nestjs/swagger/dist/decorators/api-property.decorator';
import { IsNotNullAndOptional } from './validator';

const modelPropertiesAccessor = new ModelPropertiesAccessor();

export interface FieldConfig {
	required?: boolean;
}

/**
 * Adapted from: https://github.com/nestjs/swagger/blob/master/lib/type-helpers/partial-type.helper.ts
 *
 * Note: this class relies internal implementations of the @nestjs/swagger package.
 *
 * Reason for class:
 * `PartialType` from @nestjs/swagger takes a class and makes all properties optional. In this case, optional means
 * either `<a value>`, `null` or `undefined`.
 *
 * However, there are use cases where we want optional to mean a value or `<a value>` or `undefined` but not `null`.
 * An example usecase is optionally updating a non-nullable property. Normally, `null` means delete the value.
 *
 * So this class, takes required properties and allows them to be undefined or a value, and takes non required properties and makes them completely optional
 *
 * @param classRef
 * @param overrides
 * @constructor
 */
function TypeBuilder<T, K extends keyof T>(
	classRef: Type<T>,
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
			decorators.push(IsNotNullAndOptional());
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

	return ModifiedTypeClass as Type<Partial<T>>;
}

export const NonRequiredDomainClass = <T>(
	classRef: Type<T>
): Type<Partial<T>> => {
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

export const RequiredDomainClass = <T extends object>(
	classRef: Type<T>
): Type<Required<T>> => {
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
