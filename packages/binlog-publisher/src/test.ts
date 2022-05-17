import { bootstrap } from './bootstrap';

bootstrap({
	subscriber: {
		sns: {
			topic: 'blah',
		},
	},
	listener: {
		blacklist: {
			test: {
				student: {
					id: true,
				},
			},
		},
		whitelist: {
			test: {
				student: true,
			},
		},
		user: 'root',
		password: 'password',
		database: 'test',
		port: 13306,
		host: '127.0.0.1',
	},
});
