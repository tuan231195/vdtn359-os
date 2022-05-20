import { SNS } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { chunk } from 'lodash';
import { BinlogPublisher } from 'src/publishers/interface';
import { PublishOptions } from 'src/options';

export class SnsPublisher implements BinlogPublisher {
	private sns: SNS;

	constructor(private readonly options: PublishOptions['sns']) {
		this.sns = new SNS(options);
	}

	async publishItems(items: any[]) {
		console.info(`Sending ${items.length} items to ${this.options.topic}`);
		const batches = chunk(items, 10);
		await Promise.all(
			batches.map((batch) => {
				return this.sns
					.publishBatch({
						TopicArn: this.options.topic,
						PublishBatchRequestEntries: batch.map((item) => ({
							Id: uuidv4(),
							Message: JSON.stringify(item),
						})),
					})
					.promise();
			})
		);
	}
}
