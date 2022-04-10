module.exports = {
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'sonarjs', 'prettier'],
	extends: [
		'eslint:recommended',
		'airbnb-base',
		'airbnb-typescript/base',
		'plugin:import/recommended',
		'plugin:import/typescript',
		'plugin:@typescript-eslint/recommended',
		'plugin:sonarjs/recommended',
		'prettier',
	],
	settings: {
		'import/resolver': {
			typescript: {},
		},
	},
	rules: {
		'no-plusplus': 0,
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/no-non-null-assertion': 0,
		'@typescript-eslint/return-await': 0,
		'import/prefer-default-export': 0,
		'@typescript-eslint/no-explicit-any': 0,
		'class-methods-use-this': 0,
		'prettier/prettier': 'error',
		'@typescript-eslint/ban-ts-comment': 0,
		'no-return-await': 'error',
		'max-classes-per-file': 0,
		'no-restricted-syntax': [
			'error',
			'FunctionExpression',
			'WithStatement',
			"BinaryExpression[operator='in']",
		],
		'import/no-extraneous-dependencies': [
			'error',
			{
				devDependencies: ['*.js', '**/*.spec.ts', '**/*.spec.js'],
			},
		],
	},
};
