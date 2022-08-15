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
				},
			};
		})
	);

	return Object.assign({}, ...workspaceInfos);
}

// {
//     '@ryancavanaugh/folder-pkg2': {
//         location: 'packages/folder/pkg2',
//         workspaceDependencies: ['@ryancavanaugh/pkg1'],
//     },
//     '@ryancavanaugh/pkg1': {
//         location: 'packages/pkg1',
//         workspaceDependencies: [],
//     },
//     '@ryancavanaugh/pkg2': {
//         location: 'packages/pkg2',
//         workspaceDependencies: [
//             '@ryancavanaugh/folder-pkg2',
//             '@ryancavanaugh/pkg1',
//         ],
//     },
//     '@ryancavanaugh/pkg3': {
//         location: 'packages/pkg3',
//         workspaceDependencies: [
//             '@ryancavanaugh/pkg1',
//             '@ryancavanaugh/pkg2',
//         ],
//     },
// }
