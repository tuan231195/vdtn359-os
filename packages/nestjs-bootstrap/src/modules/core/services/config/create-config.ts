import convict from 'convict';

export function createConfig<T>(schema: convict.Schema<T>): convict.Config<T> {
	const config = convict(schema);

	Object.entries(config.getProperties()).forEach(([key, value]) => {
		if (!process.env[key]) {
			process.env[key] =
				typeof value === 'string' ? value : JSON.stringify(value);
		}
	});

	config.validate();

	return config;
}
