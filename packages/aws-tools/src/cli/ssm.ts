import { CommandModule } from 'yargs';
import { ssmLookup } from 'src/lib';

const commandModule: CommandModule<
	object,
	{
		path?: string;
		cache?: boolean;
		region?: string;
	}
> = {
	describe: 'ssm command',
	handler: async function ({ path, cache, region }) {
		return ssmLookup({ path, cache, region });
	},
	command: 'ssm',
	builder: {
		path: {
			demandOption: false,
			nargs: 1,
			type: 'string',
			description: 'path to search',
			alias: 'p',
		},
		region: {
			demandOption: false,
			nargs: 1,
			type: 'string',
			description: 'AWS region',
			alias: 'r',
		},
		cache: {
			demandOption: false,
			type: 'boolean',
			description: 'whether or not to cache',
			alias: 'c',
		},
	},
};

export default commandModule;
