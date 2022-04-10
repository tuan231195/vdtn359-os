import { NpmEngine, PnpmEngine } from '@vdtn359/package-manager-utils';
import fs from 'fs';
import pkgUp from 'pkg-up';
import path from 'path';
import { getRoot } from './git-utils';

export async function getDependencies() {
	const packagePath = await pkgUp();
	const gitRoot = await getRoot();

	const packageJson = require(packagePath);
	const isPnpmWorkspace = fs.existsSync(
		path.resolve(gitRoot, 'pnpm-workspace.yaml')
	);
	let engine;
	if (isPnpmWorkspace) {
		engine = new PnpmEngine();
	} else {
		engine = new NpmEngine();
	}
	const dependenciesGraph = engine.getDependencyGraph(packagePath);
	const dependencies = dependenciesGraph.dependenciesOf(packageJson.name);

	return dependencies.map((dependency) => {
		const { path: dependencyPath } =
			dependenciesGraph.getNodeData(dependency);
		return path.relative(gitRoot, path.dirname(dependencyPath));
	});
}
