import { SNS } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { keyBy } from 'lodash';
import { PublishOptions } from 'src/options';
import { DefaultPublisher } from 'src/publishers/default';

export class SnsPublisher extends DefaultPublisher {
	private sns: SNS;

	protected MAX_BATCH_SIZE = 10;

	constructor(private readonly options: PublishOptions['sns']) {
		super(options.messageGroupKey);
		this.sns = new SNS(options);
	}

	async publishItems(items: any[]) {
		console.info(`Sending ${items.length} items to ${this.options.topic}`);

		const publishEntries = items.map((item) => ({
			Id: uuidv4(),
			Message: JSON.stringify(item),
			MessageDeduplicationId:
				this.getItemKey(item, this.options.messageDeduplicationKey) ??
				uuidv4(),
			MessageGroupId:
				this.getItemKey(item, this.options.messageGroupKey) ?? uuidv4(),
		}));
		const entriesByKey = keyBy(publishEntries, 'Id');

		const { Failed: failedItems } = await this.sns
			.publishBatch({
				TopicArn: this.options.topic,
				PublishBatchRequestEntries: publishEntries,
			})
			.promise();

		if (failedItems.length > 0) {
			for (const failedItem of failedItems) {
				console.error(
					`Failed to publish item with error: ${failedItem.Code} and error message: ${failedItem.Message}`
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
