import pluginTester from 'babel-plugin-tester';
import plugin from '..';

describe('plugin tests', () => {
	pluginTester({
		plugin,
		snapshot: true,
		babelOptions: {
			filename: __filename,
			presets: ['@babel/typescript'],
		},
		tests: [
			{
				title: 'does nothing when there is no class',
				code: `
			        import foo from './a'
			        const a = 1;
			        export default 'something else';
		        `,
			},
			{
				title: 'add properties information',
				code: `
			        class A {
			            a: number;
			            b: number;
			            c: number;
			            static d: string;
			        }
			    `,
			},
		],
	});
});
