import { S3 } from 'aws-sdk';
import { S3StorageOptions } from 'src/options';

export interface Position {
	filename?: string;
	position?: number;
	startAtEnd?: boolean;
}

export class PositionTracker {
	private s3: S3;
	private currentPosition: Position | null = null;

	constructor(private readonly options: S3StorageOptions) {
		this.s3 = new S3(options);
	}

	async getPosition() {
		if (this.currentPosition) {
			return this.currentPosition;
		}
		try {
			console.info(
				`Reading position from s3://${this.options.bucketName}/${this.options.keyName}`
			);
			const { Body: body } = await this.s3
				.getObject({
					Key: this.options.keyName,
					Bucket: this.options.bucketName,
				})
				.promise();
			this.currentPosition = JSON.parse(body.toString());
			return this.currentPosition;
		} catch (err) {
			console.error('S3 position not found', err);
			return null;
		}
	}

	async commit(position: Position) {
		try {
			if (
				JSON.stringify(this.currentPosition) ===
				JSON.stringify(position)
			) {
				return;
			}
			console.info(
				`Committing ${JSON.stringify(position)} to s3://${
					this.options.bucketName
				}/${this.options.keyName}`
			);
			await this.s3
				.putObject({
					Key: this.options.keyName,
					Bucket: this.options.bucketName,
					Body: JSON.stringify(position),
				})
				.promise();
			this.currentPosition = position;
		} catch (err) {
			console.error('Failed to commit position', err);
		}
	}
}
