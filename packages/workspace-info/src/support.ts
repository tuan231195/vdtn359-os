import fs from 'fs';
import path from 'path';
import { mapWorkspaces } from './map-workspaces';

export async function getWorkspacePackages({
	cwd,
	packageJSON,
}): Promise<Record<string, string>> {
	const map = await mapWorkspaces({
		pkg: packageJSON,
		cwd,
	});
	return Object.assign(
		{},
		...Array.from(map.entries()).map(([k, v]) => {
			return { [k]: v };
		})
	);
}

export async function readJsonFile(filePath) {
	return JSON.parse(
		await fs.promises
			.readFile(path.resolve(filePath))
			.then((x) => x.toString())
	);
}

export function getDirectPackageDependencies({
	packageJSON,
	includeDev,
	includePeer,
}) {
	let names = Object.keys(packageJSON.dependencies || {}).map((name) => ({
		name,
		type: 'dependencies',
	}));
	if (includeDev) {
		names = names.concat(
			Object.keys(packageJSON.devDependencies || {}).map((name) => ({
				name,
				type: 'devDependencies',
			}))
		);
	}
	if (includePeer) {
		names = names.concat(
			Object.keys(packageJSON.peerDependencies || {}).map((name) => ({
				name,
				type: 'peerDependencies',
			}))
		);
	}
	return names;
}

export function transformLernaConfigToYarnConfig(lernaJson) {
	if (lernaJson?.packages) {
		return {
			...lernaJson,
			workspaces: {
				packages: lernaJson?.packages,
			},
		};
	}
	return lernaJson;
}
