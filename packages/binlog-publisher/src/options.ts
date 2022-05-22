import { AtLeastOne } from 'src/types';
import { ConnectionConfig } from 'mysql';
import { ClientConfiguration as S3ClientConfiguration } from 'aws-sdk/clients/s3';
import { ClientConfiguration as SnsClientConfiguration } from 'aws-sdk/clients/sns';
import { ClientConfiguration as SqsClientConfiguration } from 'aws-sdk/clients/sqs';
import { ClientConfiguration as KinesisClientConfiguration } from 'aws-sdk/clients/kinesis';

export type RecordMapping = Record<
	string,
	boolean | Record<string, boolean | Record<string, boolean>>
>;

export type S3StorageOptions = S3ClientConfiguration & {
	bucketName: string;
	keyName: string;
};

export interface StorageOptions {
	s3: S3StorageOptions;
}

export type KeyExtractor = string | ((item: any) => string);

export type SnsPublishOptions = SnsClientConfiguration & {
	topic: string;
	messageGroupKey?: KeyExtractor;
	messageDeduplicationKey?: KeyExtractor;
};

export type SqsPublishOptions = SqsClientConfiguration & {
	queueUrl: string;
	messageGroupKey?: KeyExtractor;
	messageDeduplicationKey?: KeyExtractor;
};

export type KinesisPublishOptions = KinesisClientConfiguration & {
	streamName: string;
	partitionKey?: KeyExtractor;
};

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

export interface ProcessingOptions {
	bufferTime?: number;
	bufferCount?: number;
	blocking?: boolean;
	maxRetryCount?: number;
	retryDelay?: number;
}

export interface BootstrapOptions {
	processing?: ProcessingOptions;
	publisher: PublishOptions;
	listener: ListenerOptions & ConnectionConfig;
	storage?: StorageOptions;
}
