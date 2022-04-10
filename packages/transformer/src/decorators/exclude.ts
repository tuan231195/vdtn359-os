import { Expose } from 'src/decorators/expose';

export type ExcludeOptions = {
	groups?: string[];
};

export function Exclude(options: ExcludeOptions = {}): PropertyDecorator {
	return Expose({
		toPlain: !!options.groups,
		toClass: !!options.groups,
		excludeIf: options.groups
			? (key, value, exposeOptions, transformOptions) => {
					const { groups } = transformOptions;
					if (!groups) {
						return false;
					}
					return options.groups.some((group) =>
						groups.includes(group)
					);
			  }
			: undefined,
	});
}
