import {
	HealthCheckError,
	HealthIndicator,
	HealthIndicatorResult,
} from '@nestjs/terminus';
import { RequestLogger } from 'src/modules/core';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CustomHealthIndicatorService extends HealthIndicator {
	constructor(private readonly logger: RequestLogger) {
		super();
	}

	async isHealthy(
		key: string,
		check: () => Promise<boolean>
	): Promise<HealthIndicatorResult> {
		try {
			const result = await check();
			if (!result) {
				throw new Error('Health check failed');
			}
			return this.getStatus(key, true);
		} catch (error) {
			this.logger.error(`Failed health check ${key}`, { error });
			throw new HealthCheckError(
				`Health check issue for ${key}`,
				this.getStatus(key, false)
			);
		}
	}
}
