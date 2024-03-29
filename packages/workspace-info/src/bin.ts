#!/usr/bin/env node
import yargs from 'yargs';
import { getWorkspaceInfo } from './index';

const argv = yargs
	.option('cwd', { type: 'string' })
	.option('lerna', { type: 'boolean' })
	.option('skip-dev', { type: 'boolean' })
	.option('peer', { type: 'boolean' })
	.option('verbose', { alias: 'v', type: 'boolean' })
	.help('help').argv;

async function main() {
	const res = await getWorkspaceInfo({
		cwd: argv.cwd || process.cwd(),
		skipDev: argv['skip-dev'],
		includePeer: argv.peer,
		useLerna: argv.lerna,
	});
	console.info(JSON.stringify(res, null, 4));
}

main().catch((e) => console.error(argv.verbose ? e : e.message));
