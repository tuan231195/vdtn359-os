import { Kinesis } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { PublishOptions } from 'src/options';
import { DefaultPublisher } from 'src/publishers/default';

export class KinesisPublisher extends DefaultPublisher {
	private kinesis: Kinesis;

	constructor(private readonly options: PublishOptions['kinesis']) {
		super(options.partitionKey);
		this.kinesis = new Kinesis(options);
	}

	protected MAX_BATCH_SIZE = 250;

	async publishItems(items: any[]) {
		console.info(
			`Sending ${items.length} to kinesis ${this.options.streamName}`
		);
		const failedItems = [];

		const { Records: records } = await this.kinesis
			.putRecords({
				StreamName: this.options.streamName,
				Records: items.map((item) => ({
					PartitionKey:
						this.getItemKey(item, this.options.partitionKey) ??
						uuidv4(),
					Data: JSON.stringify(item),
				})),
			})
			.promise();

		failedItems.push(
			...Object.entries(records)
				.filter(([, record]) => {
					if (record.ErrorCode) {
						console.error(
							`Failed to publish item ${record.SequenceNumber} with error code: ${record.ErrorCode}, message: ${record.ErrorMessage}`
						);
					}
					return !!record.ErrorCode;
				})
				.map(([record]) => record)
		);

		return {
			failed: failedItems,
		};
	}
}
