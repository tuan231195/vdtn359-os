import convict from 'convict';

export function createConfig<T>(
	schema: convict.Schema<T>,
	defaults: Record<string, any> = {}
): convict.Config<T> {
	const config = convict(schema);
	for (const key of Object.keys(schema)) {
		if (config.get(key as keyof T) == null && defaults[key] !== undefined) {
			config.set(key, defaults[key]);
		}
	}
	Object.entries(config.getProperties()).forEach(([key, value]) => {
		if (!process.env[key]) {
			process.env[key] =
				typeof value === 'string' ? value : JSON.stringify(value);
		}
	});

	config.validate();

	return config;
}
