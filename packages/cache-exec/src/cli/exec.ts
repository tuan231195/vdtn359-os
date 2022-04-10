import { CommandModule } from 'yargs';
import { cacheExec } from 'src/lib';

const commandModule: CommandModule<
	object,
	{
		skipCache?: 'read' | 'write';
		cwd?: string;
		silent?: boolean;
		command: string;
		ttl?: number | string;
		temp?: boolean;
	}
> = {
	describe: 'execute and cache command',
	async handler({ skipCache, cwd, silent, command, temp, ttl }) {
		return cacheExec({
			cwd,
			silent,
			command,
			ttl,
			temp,
			skipCache,
		});
	},
	command: '$0',
	builder: {
		skipCache: {
			demandOption: false,
			type: 'string',
			description: 'Beanstalk application name',
			choices: ['read', 'write', ''],
			alias: 's',
		},
		cwd: {
			demandOption: false,
			type: 'string',
			description: 'The directory to execute the command from',
			alias: 'p',
		},
		silent: {
			demandOption: false,
			type: 'boolean',
			description: 'Whether or not to print to stdout',
		},
		temp: {
			demandOption: false,
			type: 'boolean',
			description:
				'Whether or not to use the temp directory to store the cache',
		},
		command: {
			demandOption: true,
			type: 'string',
			description: 'Command to execute',
			alias: 'c',
		},
		ttl: {
			demandOption: false,
			type: 'string',
			description:
				'Time to consider the cache entry to be valid (e.g. 5m, 5s or number of milliseconds)',
			coerce(value) {
				const number = Number(value);
				if (!Number.isNaN(number)) {
					return number;
				}
				return value;
			},
			alias: 't',
		},
	},
};

export default commandModule;
