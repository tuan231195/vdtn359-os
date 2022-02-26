import { overA } from './lens-utils';
import { compose, composeP, lensProp } from 'ramda';
const commits = lensProp('commits');
const nextRelease = lensProp('nextRelease');
const version = lensProp('version');

export const mapCommits = (fn) =>
	overA(commits, async (commits) => await fn(commits));

export const mapNextReleaseVersion = overA(compose(nextRelease, version));

export const withOptionsTransforms =
	(transforms) => (plugin) => async (pluginConfig, config) => {
		return plugin(pluginConfig, await composeP(...transforms)(config));
	};
