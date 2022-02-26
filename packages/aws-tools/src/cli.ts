#! /usr/bin/env node

process.env.AWS_SDK_LOAD_CONFIG = 'true';

import yargs from 'yargs';

yargs
	.scriptName('aws-tools')
	.command(require('./cli/s3').default)
	.command(require('./cli/ssm').default)
	.command(require('./cli/lambda').default)
	.command(require('./cli/cloudwatch').default)
	.strict(true)
	.showHelpOnFail(false).argv;
