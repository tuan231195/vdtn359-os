import { bootstrap } from './bootstrap';

bootstrap({
	publisher: {
		/* SQS
			sqs: {
				region: 'ap-southeast-2',
				queueUrl:
					'http://localhost:4566/000000000000/direct-queue-destination',
				credentials: {
					accessKeyId: 'accessKeyId',
					secretAccessKey: 'secretAccessKey',
				},
			},
		*/
		sns: {
			region: 'ap-southeast-2',
			endpoint: 'http://localhost:4566',
			topic: 'arn:aws:sns:ap-southeast-2:000000000000:direct-sns-destination',
		},
	},
	processing: {
		maxRetryCount: 2,
		retryDelay: 500,
	},
	storage: {
		s3: {
			bucketName: 'position-tracker',
			keyName: 'binlog-position',
			credentials: {
				accessKeyId: 'accessKeyId',
				secretAccessKey: 'secretAccessKey',
			},
			s3ForcePathStyle: true,
			endpoint: 'http://localhost:4566',
		},
	},
	listener: {
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
