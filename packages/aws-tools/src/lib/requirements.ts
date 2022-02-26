const detectInstalled = require('detect-installed');
const commandExists = require('command-exists').sync;

export const checkFzf = () => {
	if (!commandExists('fzf')) {
		throw new Error('Please install fzf');
	}
};

export const checkCw = () => {
	if (!commandExists('cw')) {
		throw new Error(
			'Please install cw from https://github.com/lucagrulla/cw'
		);
	}
};

export const checkCacheExec = () => {
	if (!detectInstalled.sync('@vdtn359/cache-exec')) {
		throw new Error(`Please do 'npm i -g @vdtn359/cache-exec'`);
	}
};
