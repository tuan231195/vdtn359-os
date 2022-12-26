import { spawn, SpawnOptions, ChildProcess } from 'child_process';
import { WError } from 'error';
import { checkCacheExec } from './requirements';

export class Process {
	public readonly process: ChildProcess;

	public readonly command: string;

	constructor(
		command: string,
		args: ReadonlyArray<string> = [],
		options?: SpawnOptions & { cache?: boolean }
	) {
		if (options?.cache) {
			checkCacheExec();
			this.process = spawn(
				'cache-exec',
				['-c', [command, ...args].join(' ')],
				options
			);
		} else {
			this.process = spawn(command, args, options as SpawnOptions);
		}
		this.command = [command, ...args].join(' ');
		this.process.stderr?.on('data', (data) => {
			process.stderr.write(data.toString('utf-8'));
		});
	}

	async exec() {
		return Process.pipe(this);
	}

	static pipe(...processes: Process[]): Promise<string> {
		const lastProcess = processes[processes.length - 1];

		return new Promise(async (resolve, reject) => {
			let isDone = false;
			const finish = (payload?: any) => {
				if (isDone) {
					return;
				}
				isDone = true;
				if (payload instanceof Error) {
					reject(payload);
				} else {
					resolve(payload);
				}

				for (const process of processes) {
					process.process.kill();
				}
			};

			lastProcess.process.stdout?.on('data', (data) =>
				finish(data.toString('utf-8'))
			);

			for (let i = 0; i < processes.length; i++) {
				if (i < processes.length - 1) {
					processes[i].process.stdout
						?.pipe(processes[i + 1].process.stdin!)
						.on('error', (err) => {
							WError.wrap(
								`Failed to execute commands: ${processes
									.map(({ command }) => command)
									.join(' | ')}`,
								err
							);
						});
				}

				const failWithError = (error) => {
					finish(
						WError.wrap(
							`${processes[i].command} failed with error`,
							error
						)
					);
				};

				processes[i].process.stdout?.on('error', failWithError);
				processes[i].process.on('error', failWithError);
				processes[i].process.on('close', (code) => {
					if (code !== 0) {
						finish(
							new Error(
								`${processes[i].command} exited with code ${code}`
							)
						);
					} else if (i === processes.length - 1) {
						finish();
					}
				});
			}
		});
	}
}
