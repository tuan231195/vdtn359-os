import { Process } from 'src/lib/process';
import { checkCw, checkFzf } from 'src/lib/requirements';
import { spawnSync } from 'child_process';

export async function cloudWatchLogLookup({
	cache,
	prefix,
	start = '5m',
	end,
	region,
}: {
	prefix?: string;
	cache?: boolean;
	start?: string;
	end?: string;
	region?: string;
}) {
	checkCw();
	checkFzf();
	const logGroup = await getLogGroup({ cache, region, prefix });
	const params = ['tail', logGroup, '-b', start, '-f'];
	if (end) {
		params.push('-e', end);
	}

	spawnSync(`cw ${params.join(' ')}`, {
		stdio: 'inherit',
		shell: true,
	});
}

async function getLogGroup({
	cache,
	prefix,
	region,
}: {
	cache?: boolean;
	region?: string;
	prefix?: string;
}) {
	const params = [
		'logs',
		'describe-log-groups',
		'--no-cli-pager',
		'--query',
		`logGroups[*].[logGroupName]`,
		'--output',
		'text',
	];
	if (prefix) {
		params.push('--log-group-name-prefix', prefix);
	}
	if (region) {
		params.push('--region', region);
	}
	const cloudWatchLogListParams = new Process('aws', params, {
		cache,
	});
	const fzf = new Process('fzf', []);
	return (await Process.pipe(cloudWatchLogListParams, fzf)).trim();
}
