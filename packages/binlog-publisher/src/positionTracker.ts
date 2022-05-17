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
		this.s3 = new S3();
	}

	async getPosition() {
		if (this.currentPosition) {
			return this.currentPosition;
		}
		try {
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
}
