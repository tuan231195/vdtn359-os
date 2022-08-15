// @ts-ignore
import { Plugin } from 'release-it';
import path from 'path';
import { getWorkspaceInfo, WorkspaceInfo } from '@vdtn359/workspace-info';
import * as fs from 'fs';

export class DepsPlugin extends Plugin {
	config: any;
	options: any;
	log: any;

	async bump(version) {
		const {
			outfile = 'deps.json',
			workspacePath = process.cwd(),
			packageName,
		} = this.options;

		if (outfile) {
			await this.writeDeps(version, outfile, workspacePath, packageName);
		}
	}

	private async writeDeps(
		version: string,
		outfile: string,
		workspacePath: string,
		packageName: string
	) {
		const { isDryRun } = this.config;

		const allWorkspaces = await getWorkspaceInfo({
			cwd: workspacePath,
			skipDev: true,
			includePeer: true,
		});

		const workspaceDependents = this.getPackageDependents(
			packageName,
			allWorkspaces
		);

		await Promise.all(
			workspaceDependents.map(async (workspaceDependent) => {
				const workspacePackage = allWorkspaces[workspaceDependent];
				const outFilePath = path.resolve(
					workspacePackage.location,
					outfile
				);
				this.log.exec(
					`Writing version ${packageName}/${version} to ${outFilePath}`,
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
