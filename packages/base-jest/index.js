const { pathsToModuleNameMapper } = require('ts-jest');

module.exports = ({ tsConfig = {} }) => ({
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
	},
	testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	...(tsConfig.compilerOptions &&
		tsConfig.compilerOptions.paths && {
			moduleNameMapper: pathsToModuleNameMapper(
				tsConfig.compilerOptions.paths
			),
		}),
});
