import { NestFactory } from '@nestjs/core';

export const createApp = async (module: any) => {
	return await NestFactory.createApplicationContext(module, {
		bufferLogs: true,
	});
};
