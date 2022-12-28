import { BaseStore, Item, ItemStatus } from 'src/persistence/base';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { DynamoDBClientConfig } from '@aws-sdk/client-dynamodb/dist-types/DynamoDBClient';
import { IdempotencyKeyAlreadyExists } from 'src/errors';

export class DynamoDbStore implements BaseStore {
	private documentClient: DynamoDBDocument;

	constructor(
		private readonly config: DynamoDBClientConfig,
		private readonly tableName: string,
		private readonly logger = console
	) {
		const client = new DynamoDBClient(config);
		this.documentClient = DynamoDBDocument.from(client, {
			marshallOptions: {
				removeUndefinedValues: true,
			},
		});
	}

	private query({
		tableName,
		key: keyObject,
		indexName,
		limit,
		lastEvaluatedKey,
	}: {
		tableName: string;
		key: Record<string, string | number>;
		indexName?: string;
		limit?: number;
		lastEvaluatedKey?: Record<string, any>;
	}) {
		const keys = Object.keys(keyObject);
		const expressionAttributesValues = keys.reduce(
			(agg, key) => ({
				...agg,
				[`:${key}`]: keyObject[key],
			}),
			{}
		);
		const expressionAttributesNames = keys.reduce(
			(agg, key) => ({
				...agg,
				[`#${key}`]: key,
			}),
			{}
		);
		const keyConditionExpression = keys
			.map((key) => `#${key} = :${key}`)
			.join(' AND ');
		return this.documentClient.query({
			TableName: tableName,
			ExpressionAttributeValues: expressionAttributesValues,
			ExpressionAttributeNames: expressionAttributesNames,
			KeyConditionExpression: keyConditionExpression,
			ScanIndexForward: false,
			IndexName: indexName,
			Limit: limit,
			ExclusiveStartKey: lastEvaluatedKey,
		});
	}

	async getItem<T>(idempotencyKey: string) {
		const { Items = [] } = await this.query({
			tableName: this.tableName,
			key: {
				idempotencyKey,
			},
			limit: 1,
		});
		return Items.length > 0 ? (Items[0] as Item<T>) : null;
	}

	async putItem<T>(item: Item<T>, force?: boolean): Promise<Item<T>> {
		this.logger.info(
			`Putting record for idempotency key ${item.idempotencyKey} with status ${item.status}`
		);

		const attributeKeyNotExists = 'attribute_not_exists(#idempotencyKey)';
		const idempotencyExpiryExpired =
			'(attribute_exists(#ttl) AND #ttl < :now)';
		const inProgressExpiryExpired =
			'(#status = :inProgress AND attribute_exists(#timeout) AND #timeout < :nowInMillis)';
		try {
			await this.documentClient.put({
				Item: item,
				TableName: this.tableName,
				...(!force && {
					ConditionExpression: [
						attributeKeyNotExists,
						idempotencyExpiryExpired,
						inProgressExpiryExpired,
					].join(' OR '),
					ExpressionAttributeValues: {
						':now': Math.floor(Date.now() / 1000),
						':nowInMillis': Date.now(),
						':inProgress': ItemStatus.IN_PROGRESS,
					},
					ExpressionAttributeNames: {
						'#idempotencyKey': 'idempotencyKey',
						'#ttl': 'ttl',
						'#timeout': 'timeout',
						'#status': 'status',
					},
				}),
			});
			return item;
		} catch (err: any) {
			const code = err.name ?? err.code;
			if (code === 'ConditionalCheckFailedException') {
				throw new IdempotencyKeyAlreadyExists();
			}
			throw err;
		}
	}

	async removeItem(key: string): Promise<void> {
		try {
			await this.documentClient.delete({
				TableName: this.tableName,
				Key: {
					idempotencyKey: key,
				},
			});
		} catch (err) {
			this.logger.warn(`Failed to remove item ${key}`, { err });
		}
	}
}
