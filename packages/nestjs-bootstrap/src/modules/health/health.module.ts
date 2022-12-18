import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './controllers/health';
import { CustomHealthIndicatorService } from 'src/modules/health/services';

@Module({
	imports: [TerminusModule],
	controllers: [HealthController],
	providers: [CustomHealthIndicatorService],
})
export class HealthModule {}
