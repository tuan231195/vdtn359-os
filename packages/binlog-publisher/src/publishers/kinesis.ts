import { Kinesis } from 'aws-sdk';
import { chunk } from 'lodash';
import { BinlogPublisher } from 'src/publishers/interface';
import { PublishOptions } from 'src/options';

export class KinesisPublisher implements BinlogPublisher {
	private kinesis: Kinesis;

	constructor(private readonly options: PublishOptions['kinesis']) {
		this.kinesis = new Kinesis(options);
	}

	async publishItems(items: any[]) {
		console.info(
			`Sending ${items.length} items to stream ${this.options.streamName}`
		);
		const batches = chunk(items, 10);
		await Promise.all(
			batches.map((batch) => {
				return this.kinesis
					.putRecords({
						StreamName: this.options.streamName,
						Records: batch.map((item) => ({
							PartitionKey: item[this.options.partitionKey],
							Data: JSON.stringify(item),
						})),
					})
					.promise();
			})
		);
	}
}
