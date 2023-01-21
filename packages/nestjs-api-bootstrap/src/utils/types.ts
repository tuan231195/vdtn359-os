export type OptionalToNullable<O> = {
	[K in keyof O]-?: undefined extends O[K] ? NonNullable<O[K]> | null : O[K];
};
