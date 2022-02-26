import { CommandModule } from 'yargs';
import { s3Lookup } from 'src/lib';

const commandModule: CommandModule<
	object,
	{
		bucket?: string;
		cache?: boolean;
	}
> = {
	describe: 's3 command',
	handler: async function ({ bucket, cache }) {
		return s3Lookup({ bucket, cache });
	},
	command: 's3',
	builder: {
		bucket: {
			demandOption: false,
			nargs: 1,
			type: 'string',
			description: 'bucket to search',
			alias: 'b',
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
