import crypto from 'crypto';
import fsExtra from 'fs-extra';
import fs from 'fs';
import path from 'path';
import util from 'util';
import os from 'os';
import debug from 'debug';

const removeAsync = util.promisify(fsExtra.remove).bind(fsExtra);
const mkdirpAsync = util.promisify(fsExtra.mkdirp).bind(fsExtra);
const readAsync = util.promisify(fs.readFile).bind(fs);
const writeAsync = util.promisify(fs.writeFile).bind(fs);
const existsAsync = util.promisify(fs.exists).bind(fs);
const statAsync = util.promisify(fs.stat).bind(fs);
const log = debug('cache-exec:cache');

const DIRECTORY = '.cache-exec';

type CacheArgs = {
	command: string;
	temp: boolean;
};
export async function readCache({
	command,
	temp,
}: CacheArgs): Promise<{ content: Buffer; mtimeMs: number } | null> {
	await prepareDir(temp);
	const key = hash(command);
	const file = cacheFile({ file: key, temp });
	log(`Reading from cache ${file} for command ${command}`);
	if (await existsAsync(file)) {
		log(`Cache exists for command ${command}`);
		const [content, stats] = await Promise.all([
			readAsync(file),
			statAsync(file),
		]);
		return { content, mtimeMs: stats.mtimeMs };
	}
	return null;
}

export async function writeCache({
	command,
	temp,
	content,
}: CacheArgs & { content: Buffer | string }) {
	await prepareDir(temp);
	const key = hash(command);
	const file = cacheFile({ file: key, temp });
	log(`Writing to cache ${file} for command ${command}`);
	return writeAsync(file, content);
}

export async function clearCache({
	command = '',
	home,
	temp,
}: {
	command?: string;
	home?: boolean;
	temp?: boolean;
}) {
	log(command ? `Clearing cache for command ${command}` : 'Clearing cache');
	const key = command ? hash(command) : '';
	const directories = [];
	if (home === true) {
		directories.push(homeFile(key));
	}
	if (temp === true) {
		directories.push(tmpFile(key));
	}
	if (!home && !temp) {
		directories.push(homeFile(key));
		directories.push(tmpFile(key));
	}
	log(`Removing ${directories}`);
	await Promise.all(directories.map((directory) => removeAsync(directory)));
}

function prepareDir(temp: boolean) {
	return mkdirpAsync(cacheFile({ temp }));
}

function cacheFile({ file = '', temp }: { file?: string; temp: boolean }) {
	return temp ? tmpFile(file) : homeFile(file);
}

function tmpFile(file = '') {
	const tempDir = os.tmpdir();
	if (file.startsWith('.')) {
		file = '';
	}
	return path.resolve(tempDir, DIRECTORY, file);
}

function homeFile(file = '') {
	const homeDir = os.homedir();
	if (file.startsWith('.')) {
		file = '';
	}
	return path.resolve(homeDir, DIRECTORY, file);
}

function hash(command: string) {
	const hash = crypto.createHash('md5');
	hash.update(command);
	return hash.digest('hex');
}
