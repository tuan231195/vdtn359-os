import { getMetadata } from 'src/utils/metadata';
import {
	defaultTransformOptions,
	shouldExpose,
	TransformOptions,
	TransformType,
} from 'src/utils/transform';

export class Mapper {
	private useDefault: boolean;

	private mappingCache;

	private readonly source?: any;

	private readonly destination?: any;

	private readonly mappings: Map<
		string,
		{
			to: string;
			mapper?: any;
		}
	>;

	constructor(source, destination = undefined) {
		this.useDefault = false;
		this.mappings = new Map();
		this.source = source;
		this.destination = destination;
		if (!source && !destination) {
			throw new Error('Must specify source or destination class');
		}
	}

	mapDefault() {
		const sourceMetadata = this.source
			? getMetadataFromType(this.source)
			: undefined;
		const destinationMetadata = this.destination
			? getMetadataFromType(this.destination)
			: undefined;
		if (destinationMetadata) {
			for (const [key, value] of destinationMetadata.entries()) {
				const nestedMeta = getMetadataFromType(value.type);
				let as = value.as || key;
				let fromType;
				if (sourceMetadata) {
					const foundEntry = Array.from(
						sourceMetadata.entries()
					).find(([, value]) => value.as === as);
					if (foundEntry) {
						as = foundEntry[0];
						fromType = foundEntry[1].type;
					}
				}
				this.mappings.set(as, {
					to: key,
					mapper: nestedMeta
						? this.createDefaultMapper(fromType, value.type)
						: undefined,
				});
			}
		} else if (sourceMetadata) {
			for (const [key, value] of sourceMetadata.entries()) {
				const nestedMeta = getMetadataFromType(value.type);
				this.mappings.set(key, {
					to: value.as || key,
					mapper: nestedMeta
						? this.createDefaultMapper(value.type, undefined)
						: undefined,
				});
			}
		}
		return this;
	}

	map(from, to = from, mapper = undefined) {
		this.mappings.set(from, { to, mapper });
		return this;
	}

	unmap(key) {
		this.mappings.delete(key);
		return this;
	}

	transform(object, transformOptions: TransformOptions = {}) {
		transformOptions = { ...defaultTransformOptions, ...transformOptions };
		const transformType = this.destination
			? TransformType.TO_CLASS
			: TransformType.TO_PLAIN;
		const transformToClass = !!this.destination;
		if (!object || typeof object !== 'object') {
			return object;
		}
		if (Array.isArray(object)) {
			return this.transformArray(object, transformOptions);
		}
		const sourceMetadata = this.source
			? getMetadataFromType(this.source)
			: undefined;
		const destinationMetadata = this.destination
			? getMetadataFromType(this.destination)
			: undefined;

		const result = this.destination ? new this.destination(object) : {};
		for (const [key, value] of Object.entries(object)) {
			const mapping = this.mappings.get(key);
			if (transformToClass && !mapping) {
				continue;
			}
			const metadata = transformToClass
				? destinationMetadata
				: sourceMetadata;
			if (
				!shouldExpose({
					key: transformToClass ? mapping!.to : key,
					value,
					metadata,
					transformOptions,
					transformType,
				})
			) {
				continue;
			}
			let transformedValue = value;
			if (metadata && transformOptions.transformDate) {
				const exposeOptions = metadata?.get(key);
				if (exposeOptions && exposeOptions.type === Date) {
					transformedValue = transformToClass
						? new Date(transformedValue as any)
						: transformedValue instanceof Date
						? transformedValue.toJSON()
						: transformedValue;
				}
			}
			const to = mapping?.to || key;
			result[to] = mapping?.mapper
				? mapping.mapper.transform(transformedValue, transformOptions)
				: transformedValue;
			const transform = transformOptions.transform
				? transformOptions.transform
				: (key, value) => value;
			result[to] = transform(to, result[to]);
		}
		return result;
	}

	getNestedMapper(innerPath): Mapper | undefined {
		const parts = innerPath.split('.');
		let mapper = this;
		for (const part of parts) {
			if (!mapper) {
				break;
			}
			mapper = mapper.mappings.get(part)?.mapper;
		}
		return mapper;
	}

	transformArray(object, transformOptions = {}) {
		transformOptions = { ...defaultTransformOptions, ...transformOptions };
		if (!Array.isArray(object)) {
			throw new Error('Must be an array');
		}
		return object.map((element) =>
			this.transform(element, transformOptions)
		);
	}

	private createDefaultMapper(from, to) {
		const existingMapper = this.getMapper(from, to);
		if (existingMapper) {
			return existingMapper;
		}
		return this.createMapper(from, to).mapDefault();
	}

	private createMapper(from, to): Mapper {
		if (!this.mappingCache) {
			this.mappingCache = new Map();
		}
		let map = this.mappingCache.get(from);
		if (!map) {
			map = new Map();
			this.mappingCache.set(from, map);
		}
		let mapper = map.get(to);
		if (!mapper) {
			mapper = new Mapper(from, to);
			mapper.mappingCache = this.mappingCache;
			map.set(to, mapper);
		}
		return mapper;
	}

	private getMapper(from, to) {
		if (!this.mappingCache) {
			this.mappingCache = new Map();
		}
		return this.mappingCache.get(from)?.get(to);
	}
}

function getMetadataFromType(type) {
	return getMetadata(type.prototype.constructor || type);
}
