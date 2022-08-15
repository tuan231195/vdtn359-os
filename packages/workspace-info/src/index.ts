import {
	getWorkspacePackages,
	getDirectPackageDependencies,
	readJsonFile,
	transformLernaConfigToYarnConfig,
} from './support';
import path from 'path';

type WorkspacePackage = {
	location: string;
	version: string;
	directWorkspaceDependencies: { name: string; type: string }[];
	directWorkspaceDependents: string[];
};

export type WorkspaceInfo = {
	[k: string]: WorkspacePackage;
};

export async function getWorkspaceInfo({
	cwd,
	useLerna = false,
	skipDev = false,
	includePeer = false,
}): Promise<WorkspaceInfo> {
	let packageJSON = await readJsonFile(
		path.resolve(cwd, useLerna ? 'lerna.json' : 'package.json')
	);
	if (useLerna) {
		packageJSON = transformLernaConfigToYarnConfig(packageJSON);
	}
	const packagesMap = await getWorkspacePackages({
		packageJSON,
		cwd,
	});

	const workspaceInfos = await Promise.all(
		Object.keys(packagesMap).map(async (k) => {
			const location = packagesMap[k];
			const currentPackageJson = await readJsonFile(
				path.resolve(location, 'package.json')
			);
			return {
				[k]: {
					location,
					version: currentPackageJson.version,
					directWorkspaceDependencies: getDirectPackageDependencies({
						includeDev: !skipDev,
						includePeer,
						packageJSON: currentPackageJson,
					}).filter((x) => packagesMap[x.name]),
					directWorkspaceDependents: [],
				},
			};
		})
	);

	const allWorkspaces = Object.assign({}, ...workspaceInfos);

	for (const workspaceInfo of workspaceInfos) {
		const [name, workspacePackage] = Object.entries(workspaceInfo)[0];
		const directDependencies =
			workspacePackage.directWorkspaceDependencies.map(
				({ name }) => name
			);
		for (const directDependency of directDependencies) {
			if (
				!allWorkspaces[
					directDependency
				].directWorkspaceDependents.includes(name)
			) {
				allWorkspaces[directDependency].directWorkspaceDependents.push(
					name
				);
			}
		}
	}

	return allWorkspaces;
}
