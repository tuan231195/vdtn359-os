import { CommandModule } from 'yargs';
import { lambdaLookup } from 'src/lib';

const commandModule: CommandModule<
	object,
	{
		cache?: boolean;
		region?: string;
	}
> = {
	describe: 'lambda command',
	handler: async function ({ cache, region }) {
		return lambdaLookup({ region, cache });
	},
	command: 'lambda',
	builder: {
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
