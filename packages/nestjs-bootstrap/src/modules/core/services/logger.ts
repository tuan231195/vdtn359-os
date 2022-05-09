import { createLogger, format, transports } from 'winston';

const { combine, timestamp, colorize, json } = format;

const loggerFormat = format((info) => {
	const traceId = info.traceId ? ` TraceId: ${info.traceId}` : '';

	return {
		...info,
		message: `${info.level.toUpperCase()}: ${info.timestamp} ${
			info.message
		}${traceId}`,
	};
});

let customFormat = combine(timestamp(), loggerFormat(), json());

if (process.env.ENABLE_COLORIZED_LOG === 'true') {
	customFormat = combine(
		timestamp(),
		loggerFormat(),
		colorize({ all: true }),
		json()
	);
}

export const logger = createLogger({
	format: customFormat,
	transports: [
		new transports.Console({
			level: process.env.LOG_LEVEL || 'info',
			handleExceptions: true,
		}),
	],
});
