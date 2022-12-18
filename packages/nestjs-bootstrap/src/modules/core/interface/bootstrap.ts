import convict from 'convict';

export interface SwaggerOptions {
	path?: string;
	title?: string;
	description?: string;
}

export interface BootstrapOptions {
	swagger?: SwaggerOptions;
	version: string;
	name: string;
	config: convict.Config<any>;
	healthChecks?: Record<string, () => Promise<boolean>>;
}
