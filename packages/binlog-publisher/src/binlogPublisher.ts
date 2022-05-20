import { PublishOptions } from 'src/options';
import { SnsPublisher } from 'src/publishers/sns';
import { SqsPublisher } from 'src/publishers/sqs';
import { KinesisPublisher } from 'src/publishers/kinesis';

export const getBinlogPublisher = (publishOptions: PublishOptions) => {
	if (publishOptions.sns) {
		return new SnsPublisher(publishOptions.sns);
	}
	if (publishOptions.sqs) {
		return new SqsPublisher(publishOptions.sqs);
	}
	if (publishOptions.kinesis) {
		return new KinesisPublisher(publishOptions.kinesis);
	}
	throw new Error('Unknown publisher');
};
