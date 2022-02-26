import { CommandModule } from 'yargs';
import { clearCache } from 'src/lib';

const commandModule: CommandModule<
	object,
	{
		command?: string;
		temp?: boolean;
		home?: boolean;
	}
> = {
	describe: 'clear cache command',
	handler: async function ({ command, temp, home }) {
		return clearCache({ command, home, temp });
	},
	command: 'clear',
	builder: {
		command: {
			demandOption: false,
			type: 'string',
			description: 'Command to clear',
			alias: 'c',
		},
		temp: {
			demandOption: false,
			type: 'boolean',
			description: 'Whether or not to clear only the temp cache',
			alias: 't',
		},
		home: {
			demandOption: false,
			type: 'boolean',
			description: 'Whether or not to clear only the home cache',
			alias: 'h',
		},
	},
};

export default commandModule;
