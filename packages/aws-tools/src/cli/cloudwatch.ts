import { CommandModule } from 'yargs';
import { cloudWatchLogLookup } from 'src/lib';

const commandModule: CommandModule<
	object,
	{
		prefix?: string;
		start?: string;
		end?: string;
		cache?: boolean;
		region?: string;
	}
> = {
	describe: 'cloudWatch command',
	handler: async function ({ cache, region, prefix, start, end }) {
		return cloudWatchLogLookup({ prefix, cache, region, start, end });
	},
	command: 'cw',
	builder: {
		prefix: {
			demandOption: false,
			nargs: 1,
			type: 'string',
			description: 'prefix of log group',
			alias: 'p',
		},
		start: {
			demandOption: false,
			nargs: 1,
			type: 'string',
			description:
				'start of the date range e.g. 5m for 5 minutes before or UTC date time',
			alias: 's',
		},
		end: {
			demandOption: false,
			nargs: 1,
			type: 'string',
			description:
				'end of the date range e.g. 5m for 5 minutes before or UTC date time',
			alias: 'e',
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
