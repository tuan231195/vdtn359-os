import { readCache, writeCache } from 'src/lib/cache';
import ms from 'ms';
import debug from 'debug';
import sh from 'shelljs';

const log = debug('cache-exec:exec');

type ExecArgs = {
	skipCache?: 'read' | 'write' | '';
	command: string;
	temp?: boolean;
	cwd?: string;
	ttl?: number | string;
	silent?: boolean;
};

export async function cacheExec(options: ExecArgs) {
	const { cwd, skipCache, command, temp, ttl, silent } = options;
	log(`Options ${JSON.stringify(options, undefined, 4)}`);
	log(`Executing command ${command}`);
	if (skipCache !== '' && skipCache !== 'read') {
		// try to read from cache first
		const cacheContent = await readCache({ command, temp });
		if (cacheContent) {
			// if cache content is valid return cacheContent
			if (!ttl || Date.now() - standardTTL(ttl) < cacheContent.mtimeMs) {
				log(`Use cache for command ${command}`);
				if (!silent) {
					process.stdout.write(cacheContent.content);
				}
				return cacheContent;
			} else {
				log(`Cache is not valid for command ${command}`);
			}
		}
	}
	return new Promise((resolve, reject) => {
		if (cwd) {
			log(`Go to ${cwd}`);
			sh.cd(cwd);
		}
		sh.exec(
			command,
			{
				fatal: true,
				silent,
			},
			async (code, stdout) => {
				log(`Executed command ${command} with code ${code}`);
				if (code !== 0) {
					return reject(
						new Error(`Program exited with code ${code}`)
					);
				}
				if (skipCache !== '' && skipCache !== 'write') {
					try {
						if (!silent) {
							await writeCache({
								command,
								temp,
								content: stdout,
							});
						}
						resolve(stdout);
					} catch (e) {
						reject(e);
					}
				} else {
					resolve(stdout);
				}
			}
		);
	});
}

function standardTTL(ttl: number | string): number {
	if (typeof ttl === 'number') {
		return ttl;
	}
	return ms(ttl);
}
