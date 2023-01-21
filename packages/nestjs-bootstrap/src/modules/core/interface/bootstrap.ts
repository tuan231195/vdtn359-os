import convict from 'convict';

export interface BootstrapOptions {
	version: string;
	name: string;
	config: convict.Config<any> | (() => Promise<convict.Config<any>>);
}
