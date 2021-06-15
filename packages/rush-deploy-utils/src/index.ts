#! /usr/bin/env node
/* eslint-disable no-console */
import yargs from 'yargs';
import { getPackageDeps } from '@rushstack/package-deps-hash';
import * as rushLib from '@microsoft/rush-lib';
import * as path from 'path';
import crypto from 'crypto';
import * as fs from 'fs';
import execa from 'execa';

const { argv } = yargs;

switch (argv.action) {
	case 'get-hash': {
		const packageHash = getDepsHash(argv.package as string);
		console.info(packageHash);
		break;
	}
	case 'update-hash': {
		updateHash(argv.package as string);
		break;
	}
	case 'deploy':
		deploy(argv as any);
		break;
}

function getConfig() {
	return rushLib.RushConfiguration.loadFromDefaultLocation({
		startingFolder: process.cwd(),
	});
}

function getDepsHash(packageName: string) {
	const md5 = crypto.createHash('md5');
	const config = getConfig();
	const rushProject = getRushProject(config, packageName);

	const deps = getDependencies(config, rushProject);

	for (const dep of deps) {
		const hashes = getPackageHash(config, dep);
		for (const [file, hash] of Object.entries(hashes)) {
			md5.update(file);
			md5.update(hash as string);
		}
	}
	return md5.digest('hex');
}

function getRushProject(config, packageName: string) {
	const rushProject = config.findProjectByShorthandName(packageName);
	if (!rushProject) {
		throw new Error(`Package ${packageName} not found`);
	}
	return rushProject;
}

function deploy({
	package: packageName,
	force,
	script = 'deploy.sh',
}: {
	package: string;
	force?: boolean;
	script?: string;
}) {
	const config = getConfig();
	const rushProject = getRushProject(config, packageName);
	const buildInfoPath = path.resolve(
		rushProject.projectFolder,
		'build-hash.info'
	);
	const oldHash =
		(fs.existsSync(buildInfoPath) &&
			fs.readFileSync(buildInfoPath, {
				encoding: 'utf-8',
			})) ||
		'';
	const newHash = getDepsHash(packageName);

	if (force || oldHash !== newHash) {
		updateHash(packageName);
		console.info(`Triggering ${script} for ${packageName}`);
		execa(path.resolve(rushProject.projectFolder, script), {
			cwd: rushProject.projectFolder,
			stdout: 'inherit',
			env: {
				BUILD_HASH: newHash,
			},
		});
	}
}

function updateHash(packageName: string) {
	const config = getConfig();
	const rushProject = getRushProject(config, packageName);

	const packageHash = getDepsHash(packageName);
	const buildInfoPath = path.resolve(
		rushProject.projectFolder,
		'build-hash.info'
	);
	fs.writeFileSync(buildInfoPath, packageHash, {
		encoding: 'utf-8',
	});
}

function getPackageHash(
	config: rushLib.RushConfiguration,
	packageName: string
) {
	const rushProject = config.findProjectByShorthandName(packageName);
	if (!rushProject) {
		throw new Error(`Package ${packageName} not found`);
	}
	return Array.from(
		getPackageDeps(rushProject.projectFolder).entries()
	).reduce((current, [file, hash]) => {
		if (file === 'build-hash.info') {
			return current;
		}
		return {
			...current,
			[path.resolve(rushProject.projectFolder, file)]: hash,
		};
	}, {});
}

function getDependencies(
	rushConfig: rushLib.RushConfiguration,
	toProject: rushLib.RushConfigurationProject
) {
	const queue = [];
	const visited = {};

	queue.push(toProject);
	while (queue.length > 0) {
		const currentProject = queue.shift();
		if (visited[currentProject.packageName]) {
			continue;
		}
		visited[currentProject.packageName] = true;
		for (const dependencyProject of currentProject.dependencyProjects) {
			if (dependencyProject.projectRelativeFolder.startsWith('tools')) {
				continue;
			}
			queue.push(dependencyProject);
		}
	}
	return Object.keys(visited);
}
