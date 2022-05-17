import { AtLeastOne } from 'src/types';
import { ConnectionConfig } from 'mysql';

export type RecordMapping = Record<
	string,
	boolean | Record<string, boolean | Record<string, boolean>>
>;

export interface S3StorageOptions {
	bucketName: string;
	keyName: string;
}

export interface StorageOptions {
	s3: S3StorageOptions;
}

export interface SnsPublishOptions {
	topic: string;
	region?: string;
}

export interface SqsPublishOptions {
	queueName: string;
	region?: string;
}

export interface KinesisPublishOptions {
	streamName: string;
	region?: string;
}

export type PublishOptions = AtLeastOne<{
	sns: SnsPublishOptions;
	sqs: SqsPublishOptions;
	kinesis: KinesisPublishOptions;
}>;

export interface ListenerOptions {
	whitelist?: RecordMapping;
	blacklist?: RecordMapping;
	startAtEnd?: boolean;
}

export interface BootstrapOptions {
	subscriber: PublishOptions;
	listener: ListenerOptions & ConnectionConfig;
	storage?: StorageOptions;
}
