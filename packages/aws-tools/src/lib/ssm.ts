import { Process } from 'src/lib/process';
import { checkFzf } from 'src/lib/requirements';
import AWS from 'aws-sdk';

export async function ssmLookup({
	path,
	cache,
	region,
}: {
	path?: string;
	cache?: boolean;
	region?: string;
}) {
	checkFzf();
	const ssm = new AWS.SSM({ region });

	const parameter = await getParameter({ cache, path, region });
	const { Parameter } = await ssm
		.getParameter({
			Name: parameter,
			WithDecryption: true,
		})
		.promise();
	process.stdout.write(Parameter?.Value as string);
}

async function getParameter({
	cache,
	path,
	region,
}: {
	cache?: boolean;
	path?: string;
	region?: string;
}) {
	const params = [
		'ssm',
		'get-parameters-by-path',
		'--path',
		path ?? '/',
		'--no-cli-pager',
		'--recursive',
		'--query',
		`Parameters[*].[Name]`,
		'--output',
		'text',
	];
	if (region) {
		params.push('--region', region);
	}
	const ssmListParams = new Process('aws', params, {
		cache,
	});
	const fzf = new Process('fzf', []);
	return (await Process.pipe(ssmListParams, fzf)).trim();
}
