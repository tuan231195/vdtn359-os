// @ts-ignore
import { Plugin } from 'release-it';
import path from 'path';
import { getWorkspaceInfo, WorkspaceInfo } from '@vdtn359/workspace-info';
import * as fs from 'fs';

export default class DepsPlugin extends Plugin {
	config: any;
	options: any;
	log: any;

	async bump(version) {
		const {
			outFile = 'deps.json',
			versionFile = 'version.json',
			hash,
			workspacePath = process.cwd(),
			packageName,
		} = this.options;

		const allWorkspaces = await getWorkspaceInfo({
			cwd: workspacePath,
			skipDev: true,
			includePeer: true,
		});

		await this.writeVersionAndHash({
			version,
			versionFile,
			hash,
			allWorkspaces,
			packageName,
		});
		await this.writeDeps({
			version,
			outFile,
			allWorkspaces,
			packageName,
		});
	}

	private async writeVersionAndHash({
		version,
		versionFile,
		allWorkspaces,
		packageName,
		hash: hashFn = () => undefined,
	}: {
		version: string;
		versionFile: string;
		allWorkspaces: WorkspaceInfo;
		packageName: string;
		hash: any;
	}) {
		const { isDryRun } = this.config;
		const hash = await hashFn({ version, allWorkspaces, packageName });
		this.log.exec(
			`Writing version ${packageName}@${version}#${
				hash || ''
			} to ${versionFile}`,
			isDryRun
		);
		if (!isDryRun) {
			await fs.promises.writeFile(
				versionFile,
				JSON.stringify({
					version,
					hash,
				}),
				{
					encoding: 'utf8',
				}
			);
		}
	}

	private async writeDeps({
		version,
		outFile,
		allWorkspaces,
		packageName,
	}: {
		version: string;
		outFile: string;
		allWorkspaces: WorkspaceInfo;
		packageName: string;
	}) {
		const { isDryRun } = this.config;

		const workspaceDependents = this.getPackageDependents(
			packageName,
			allWorkspaces
		);

		await Promise.all(
			workspaceDependents.map(async (workspaceDependent) => {
				const workspacePackage = allWorkspaces[workspaceDependent];
				const outFilePath = path.resolve(
					workspacePackage.location,
					outFile
				);
				this.log.exec(
					`Writing version ${packageName}@${version} to ${outFilePath}`,
					isDryRun
				);

				if (!isDryRun) {
					let currentDeps: Record<string, string> = {};
					const fileExists = !!(await fs.promises
						.stat(outFilePath)
						.catch(() => null));
					if (fileExists) {
						currentDeps = JSON.parse(
							await fs.promises.readFile(outFilePath, {
								encoding: 'utf8',
							})
						);
					}
					currentDeps[packageName] = version;
					await fs.promises.writeFile(
						outFilePath,
						JSON.stringify(currentDeps),
						{
							encoding: 'utf8',
						}
					);
				}
			})
		);
	}

	private getPackageDependents(
		packageName: string,
		workspaceInfo: WorkspaceInfo
	): string[] {
		const workspacePackage = workspaceInfo[packageName];

		if (!workspacePackage) {
			return;
		}

		return Array.from(
			new Set([
				...workspacePackage.directWorkspaceDependents,
				...workspacePackage.directWorkspaceDependents
					.map((name) =>
						this.getPackageDependents(name, workspaceInfo)
					)
					.flat(),
			])
		);
	}
}
