import { Process } from 'src/lib/process';
import { checkFzf } from 'src/lib/requirements';
import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export async function s3Lookup({
	bucket,
	cache,
}: {
	bucket?: string;
	cache?: boolean;
}) {
	checkFzf();
	let searchBucket: string;
	if (!bucket) {
		searchBucket = await getBucket(cache);
	} else {
		searchBucket = bucket;
	}
	const s3ListBucket = new Process(
		'aws',
		['s3', 'ls', '--recursive', `s3://${searchBucket}`],
		{
			cache,
		}
	);
	const fzf = new Process('fzf');
	const cut = new Process('awk', ['{print $4}']);
	const key = (await Process.pipe(s3ListBucket, fzf, cut)).trim();

	console.info(`Getting ${key} from ${searchBucket}`);

	const { Body = '' } = await s3
		.getObject({
			Bucket: searchBucket,
			Key: key,
		})
		.promise();

	process.stdout.write(Body.toString('utf-8'));
}

async function getBucket(cache?: boolean) {
	const s3ListBucket = new Process('aws', ['s3', 'ls', '--no-cli-pager'], {
		cache,
	});
	const fzf = new Process('fzf');
	const cut = new Process('awk', ['{print $3}']);
	return (await Process.pipe(s3ListBucket, fzf, cut)).trim();
}
