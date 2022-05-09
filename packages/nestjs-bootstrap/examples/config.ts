import { createConfig } from '../src';

export const config = createConfig({
	APP_HOST: {
		format: String,
		nullable: false,
		default: '0.0.0.0',
		env: 'APP_HOST',
	},
	PORT: {
		format: 'port',
		default: 8080,
		env: 'PORT',
	},
});

export type Config = typeof config;
