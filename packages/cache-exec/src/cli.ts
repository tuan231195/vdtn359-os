#! /usr/bin/env node

import yargs from 'yargs';

yargs
	.scriptName('cache-exec')
	.command(require('./cli/exec').default)
	.command(require('./cli/clear').default)
	.strict(true)
	.showHelpOnFail(false).argv;
