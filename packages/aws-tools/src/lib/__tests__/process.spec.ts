import { Process } from '../process';

describe('Process', () => {
	describe('exec', () => {
		it('should exec a process', async () => {
			const process = new Process('basename', [__filename]);
			expect(await process.exec()).toEqual('process.spec.ts\n');
		});

		it('should throw an error', async () => {
			const process = new Process('ls', ['blah']);
			await expect(process.exec()).rejects.toThrow(
				'ls blah exited with code'
			);
		});
	});

	describe('pipeline', () => {
		it('should pipeline multiple processes', async () => {
			const basename = new Process('basename', [__filename]);
			const cut = new Process('cut', ['-d', '.', '-f', '2']);
			const tr = new Process('tr', ['[:lower:]', '[:upper:]']);
			expect(await Process.pipe(basename, cut, tr)).toEqual('SPEC\n');
		});

		it('should throw an error if any of the middle process fails', async () => {
			const basename = new Process('basename', [__filename]);
			const cut = new Process('blah', ['-d', '.', '-f', '1']);
			const tr = new Process('tr', ['[:lower:]', '[:upper:]']);
			await expect(Process.pipe(basename, cut, tr)).rejects.toThrow(
				'blah -d . -f 1 failed with error: spawn blah ENOENT'
			);
		});
	});
});
