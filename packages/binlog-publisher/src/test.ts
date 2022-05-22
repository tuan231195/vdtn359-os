import { bootstrap } from './bootstrap';

bootstrap({
	publisher: {
		// sqs: {
		// 	region: 'ap-southeast-2',
		// 	queueUrl:
		// 		'http://localhost:4566/000000000000/direct-queue-destination',
		// },
		kinesis: {
			region: 'ap-southeast-2',
			streamName: 'direct-kinesis-destination',
			endpoint: 'http://localhost:4566',
			partitionKey: (item) => {
				if (Math.random() < 0.2) {
					return 1;
				}
				return item.after.id.toString();
			},
		},
		/*sns: {
			region: 'ap-southeast-2',
			endpoint: 'http://localhost:4566',
			topic: 'arn:aws:sns:ap-southeast-2:000000000000:direct-sns-destination',
		},*/
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
