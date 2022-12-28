import convict from 'convict';

export function createConfig<T>(
	schema: convict.Schema<T>,
	defaults: Record<string, any> = {}
): convict.Config<T> {
	const config = convict(schema);
	for (const [key, value] of Object.entries(defaults)) {
		config.set(key, value);
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
