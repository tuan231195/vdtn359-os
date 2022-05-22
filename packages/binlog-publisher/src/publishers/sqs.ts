import { SQS } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { keyBy } from 'lodash';
import { PublishOptions } from 'src/options';
import { DefaultPublisher } from 'src/publishers/default';

export class SqsPublisher extends DefaultPublisher {
	private sqs: SQS;

	constructor(private readonly options: PublishOptions['sqs']) {
		super(options.messageGroupKey);
		this.sqs = new SQS(options);
	}

	protected MAX_BATCH_SIZE = 10;

	async publishItems(items: any[]) {
		console.info(
			`Sending ${items.length} items to sqs ${this.options.queueUrl}`
		);

		const publishEntries = items.map((item) => ({
			Id: uuidv4(),
			MessageBody: JSON.stringify(item),
			MessageDeduplicationId: this.getItemKey(
				item,
				this.options.messageDeduplicationKey
			),
			MessageGroupId: this.getItemKey(item, this.options.messageGroupKey),
		}));
		const entriesByKey = keyBy(publishEntries, 'Id');

		const { Failed: failedItems } = await this.sqs
			.sendMessageBatch({
				QueueUrl: this.options.queueUrl,
				Entries: publishEntries,
			})
			.promise();

		if (failedItems.length > 0) {
			for (const failedItem of failedItems) {
				console.error(
					`Failed to send item with error code: ${failedItem.Code} and error message: ${failedItem.Message}`
				);
			}
		}

		return {
			failed: failedItems.map(
				(failedItem) => entriesByKey[failedItem.Id]
			),
		};
	}
}
