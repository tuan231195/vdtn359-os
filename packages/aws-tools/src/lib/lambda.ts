import { Process } from 'src/lib/process';
import { checkFzf } from 'src/lib/requirements';
import AWS from 'aws-sdk';

export async function lambdaLookup({
	cache,
	region,
}: {
	cache?: boolean;
	region?: string;
}) {
	checkFzf();
	const lambda = new AWS.Lambda({ region });

	const functionName = await getFunction({ cache, region });
	const result = await lambda
		.getFunction({
			FunctionName: functionName,
		})
		.promise();
	process.stdout.write(JSON.stringify(result, undefined, 4));
}

async function getFunction({
	cache,
	region,
}: {
	cache?: boolean;
	region?: string;
}) {
	const params = [
		'lambda',
		'list-functions',
		'--no-cli-pager',
		'--query',
		`Functions[*].[FunctionName]`,
		'--output',
		'text',
	];
	if (region) {
		params.push('--region', region);
	}
	const lambdaListParams = new Process('aws', params, {
		cache,
	});
	const fzf = new Process('fzf', []);
	return (await Process.pipe(lambdaListParams, fzf)).trim();
}
