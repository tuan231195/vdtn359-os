import { Partition } from 'src/publishers/partition';
import { KeyExtractor } from 'src/options';
import { BinlogPublisher } from 'src/publishers/interface';

export abstract class DefaultPublisher<T extends object = any>
	implements BinlogPublisher
{
	abstract publishItems(items: any[]): Promise<{ failed: any[] }>;

	protected abstract MAX_BATCH_SIZE: number;

	constructor(private readonly partitionKey?: KeyExtractor) {}

	partition(items: T[]): Partition<T>[] {
		const partitions: Partition<T>[] = [];

		for (const item of items) {
			let currentPartition: Partition<T>;
			for (const partition of partitions) {
				if (partition.accept(item)) {
					currentPartition = partition;
					break;
				}
			}
			if (!currentPartition) {
				currentPartition = new Partition<T>(
					this.partitionKey,
					!!this.partitionKey,
					this.MAX_BATCH_SIZE
				);
				partitions.push(currentPartition);
			}
			currentPartition.add(item);
		}
		return partitions;
	}

	protected getItemKey(item: T, keyExtractor?: KeyExtractor) {
		const key =
			typeof keyExtractor === 'function'
				? keyExtractor(item)
				: item[keyExtractor];
		return key ?? undefined;
	}
}
