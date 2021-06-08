#!/usr/bin/env node

/* eslint-disable no-console */

import yargs from 'yargs';
import * as rushLib from '@microsoft/rush-lib';
import path from 'path';
import chalk from 'chalk';
import execa from 'execa';
import { Transform } from 'stream';
import { EventEmitter } from 'events';
import Randoma from 'randoma';
import batchingToposort from 'batching-toposort';

const random = new Randoma({ seed: 10 });

const program = yargs
	.scriptName('rush-watcher')
	.option('to', {
		demandOption: false,
		description: 'include PROJECT and all its dependencies',
		alias: 't',
		type: 'string',
	})
	.option('to-except', {
		demandOption: false,
		description:
			'include all projects dependencies of PROJECT except itself',
		alias: 'T',
		type: 'string',
	})
	.option('from', {
		demandOption: false,
		description: 'include PROJECT and all projects that depend on it',
		alias: 'f',
		type: 'string',
	})
	.option('from-except', {
		demandOption: false,
		description:
			'include all projects that depend on PROJECT except itself',
		alias: 'F',
		type: 'string',
	})
	.option('only', {
		demandOption: false,
		description: 'include only the given project',
		alias: 'o',
		type: 'string',
	})
	.option('command', {
		demandOption: false,
		description: 'command to run',
		default: 'dev',
		alias: 'c',
		type: 'string',
	})
	.showHelpOnFail(true)
	.help(true);

program.command(
	'$0',
	'run rush dev watcher processes',
	() => {
		// not needed
	},
	async ({ command, to, from, toExcept, fromExcept, only }) => {
		const rushConfig = getConfig();
		const projectLayers = getProjects(rushConfig, {
			to,
			from,
			toExcept,
			fromExcept,
			only,
		});
		for (const projectLayer of projectLayers) {
			await Promise.all(
				projectLayer.map(async (project) => {
					try {
						await startBuilding(project, command);
					} catch (e) {
						console.error(
							`Project ${project.packageName} failed with code ${e.exitCode}`
						);
					}
				})
			);
		}
	}
).argv;

function getConfig() {
	return rushLib.RushConfiguration.loadFromDefaultLocation({
		startingFolder: process.cwd(),
	});
}

function transformer(color, prefix) {
	const emitter = new EventEmitter();
	const transform = new Transform({
		transform(chunk, enc, cb) {
			chunk = chunk.toString();
			if (
				// TSC watcher
				chunk.includes('Watching for file changes') ||
				// Webpack finished
				chunk.includes('Built at:') ||
				// API
				chunk.includes('[nodemon]') ||
				//Next
				chunk.includes('[ ready ]')
			) {
				emitter.emit('initial-build-done');
			}

			let lines = chunk.split('\n').filter((line, index, array) => {
				return !(line === '' && array[index - 1] === '');
			});
			lines = lines
				.map((line) => `${chalk.hex(color)(prefix)}: ${line}`)
				.join('\n');
			if (!lines.endsWith('\n')) {
				lines += '\n';
			}
			cb(null, lines);
		},
	});

	return { transform, emitter };
}

function startBuilding(
	project: rushLib.RushConfigurationProject,
	command = 'dev'
) {
	const devCommand = require(path.join(project.projectFolder, 'package.json'))
		.scripts[command];
	if (!devCommand) {
		return Promise.resolve();
	}

	const args = [command];
	if (devCommand.includes('tsc')) {
		args.push('--preserveWatchOutput');
	}

	const randomColor = random.color().hex().toString();
	console.log(
		`${chalk.hex(randomColor)(project.packageName)}: Running ${devCommand}`
	);

	const pr = execa('rushx', args, {
		cwd: project.projectFolder,
		stripFinalNewline: true,
		env: { FORCE_COLOR: 'true' },
	});

	const { emitter, transform } = transformer(
		randomColor,
		project.packageName
	);

	pr.stdout.pipe(transform);
	pr.stderr.pipe(transform);
	transform.pipe(process.stdout);

	return new Promise(async (resolve, reject) => {
		emitter.once('initial-build-done', resolve);
		try {
			await pr;
			resolve();
		} catch (e) {
			reject(e);
		}
	});
}

function getProjects(
	rushConfig: rushLib.RushConfiguration,
	{ to, from, toExcept, fromExcept, only }
) {
	if (only) {
		return [[getProject(rushConfig, only)]];
	}

	if (to || toExcept) {
		const toProject = getProject(rushConfig, to || toExcept);
		const projectLayers = dependencyLayer(rushConfig, toProject);

		if (toExcept) {
			projectLayers[projectLayers.length - 1] = projectLayers[
				projectLayers.length - 1
			].filter(
				(project) => project.packageName !== toProject.packageName
			);
		}

		return projectLayers;
	}

	if (from || fromExcept) {
		const fromProject = getProject(rushConfig, from || fromExcept);
		const projectLayers = consumingLayer(rushConfig, fromProject);

		if (fromExcept) {
			projectLayers[0] = projectLayers[0].filter(
				(project) => project.packageName !== fromProject.packageName
			);
		}
		return projectLayers;
	}
	return allLayer(rushConfig);
}

function dependencyLayer(
	rushConfig: rushLib.RushConfiguration,
	toProject: rushLib.RushConfigurationProject
): rushLib.RushConfigurationProject[][] {
	const dag: Record<string, string[]> = {};
	const projectMap = {};
	const queue: rushLib.RushConfigurationProject[] = [];
	const visited: Record<string, boolean> = {};

	queue.push(toProject);
	while (queue.length > 0) {
		const currentProject = queue.shift();
		if (visited[currentProject.packageName]) {
			continue;
		}
		visited[currentProject.packageName] = true;
		projectMap[currentProject.packageName] = currentProject;
		dag[currentProject.packageName] = dag[currentProject.packageName] || [];

		for (const dependencyProject of currentProject.dependencyProjects) {
			dag[currentProject.packageName].push(dependencyProject.packageName);
			queue.push(dependencyProject);
		}
	}
	return toProjects(projectMap, batchingToposort(dag).reverse());
}

function consumingLayer(
	rushConfig: rushLib.RushConfiguration,
	fromProject: rushLib.RushConfigurationProject
): rushLib.RushConfigurationProject[][] {
	const dag: Record<string, string[]> = {};
	const projectMap = {};
	const queue: rushLib.RushConfigurationProject[] = [];
	const visited: Record<string, boolean> = {};

	queue.push(fromProject);
	while (queue.length > 0) {
		const currentProject = queue.shift();
		if (visited[currentProject.packageName]) {
			continue;
		}
		visited[currentProject.packageName] = true;
		projectMap[currentProject.packageName] = currentProject;
		dag[currentProject.packageName] = dag[currentProject.packageName] || [];

		for (const dependencyProject of currentProject.consumingProjects) {
			dag[currentProject.packageName].push(dependencyProject.packageName);
			queue.push(dependencyProject);
		}
	}
	return toProjects(projectMap, batchingToposort(dag));
}

function allLayer(
	rushConfig: rushLib.RushConfiguration
): rushLib.RushConfigurationProject[][] {
	const dag: Record<string, string[]> = {};
	const projectMap = {};
	const queue: rushLib.RushConfigurationProject[] = [];
	const visited: Record<string, boolean> = {};

	for (const project of rushConfig.projects) {
		if (visited[project.packageName]) {
			continue;
		}
		queue.push(project);

		while (queue.length > 0) {
			const currentProject = queue.shift();
			projectMap[currentProject.packageName] = currentProject;
			dag[currentProject.packageName] =
				dag[currentProject.packageName] || [];
			visited[project.packageName] = true;
			for (const dependencyProject of currentProject.consumingProjects) {
				dag[currentProject.packageName].push(
					dependencyProject.packageName
				);
				queue.push(dependencyProject);
			}
		}
	}
	return toProjects(projectMap, batchingToposort(dag));
}

function toProjects(
	projectMap: Record<string, rushLib.RushConfigurationProject>,
	dag: [string[]]
) {
	return dag.map((layer) => layer.map((project) => projectMap[project]));
}

function getProject(rushConfig: rushLib.RushConfiguration, name: string) {
	const project = rushConfig.findProjectByShorthandName(name);
	if (!project) {
		throw new Error(`Project ${name} not found`);
	}
	return project;
}
