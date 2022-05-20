import { SQS } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { chunk } from 'lodash';
import { BinlogPublisher } from 'src/publishers/interface';
import { PublishOptions } from 'src/options';

export class SqsPublisher implements BinlogPublisher {
	private sqs: SQS;

	constructor(private readonly options: PublishOptions['sqs']) {
		this.sqs = new SQS(options);
	}

	async publishItems(items: any[]) {
		console.info(
			`Sending ${items.length} items to sqs ${this.options.queueUrl}`
		);
		const batches = chunk(items, 10);
		await Promise.all(
			batches.map((batch) => {
				return this.sqs
					.sendMessageBatch({
						QueueUrl: this.options.queueUrl,
						Entries: batch.map((item) => ({
							Id: uuidv4(),
							MessageBody: JSON.stringify(item),
							MessageDeduplicationId: this.options
								.messageDeduplicationKey
								? item[this.options.messageDeduplicationKey]
								: undefined,
							MessageGroupId: this.options.messageGroupKey
								? item[this.options.messageGroupKey]
								: undefined,
						})),
					})
					.promise();
			})
		);
	}
}
