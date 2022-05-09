const baseConfig = require('../../jest.config.base');

module.exports = {
	...baseConfig(__dirname),
	roots: ['<rootDir>/src', '<rootDir>/examples'],
	displayName: 'nestjs-bootstrap',
};
