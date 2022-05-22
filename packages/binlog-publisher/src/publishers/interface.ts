import { Partition } from 'src/publishers/partition';

export interface BinlogPublisher<T extends object = any> {
	publishItems(items: T[]): Promise<{ failed: T[] }>;
	partition(items: T[]): Partition<T>[];
}
