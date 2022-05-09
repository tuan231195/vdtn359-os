import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { BootstrapOptions } from 'src/modules/core/interface';
import { BOOTSTRAP_OPTIONS_TOKEN } from 'src/modules/core';
import { CustomHealthIndicatorService } from 'src/modules/health/services';

@ApiTags('Health')
@Controller('health')
export class HealthController {
	constructor(
		private health: HealthCheckService,
		private customHealthIndicatorService: CustomHealthIndicatorService,
		@Inject(BOOTSTRAP_OPTIONS_TOKEN)
		private readonly bootstrapOptions: BootstrapOptions
	) {}

	@Get()
	@HealthCheck()
	check() {
		const healthChecks = Object.entries(
			this.bootstrapOptions.healthChecks || {}
		).map(
			([key, check]) =>
				() =>
					this.customHealthIndicatorService.isHealthy(key, check)
		);
		return this.health.check(healthChecks);
	}
}
