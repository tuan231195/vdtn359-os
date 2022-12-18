import { createLogger, format, transports } from 'winston';
import { consoleFormat } from 'winston-console-format';

const { combine, timestamp, colorize, padLevels, json } = format;

const isColorizedLogEnabled = process.env.ENABLE_COLORIZED_LOG === 'true';

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

if (isColorizedLogEnabled) {
	customFormat = combine(
		timestamp(),
		loggerFormat(),
		colorize({ all: true }),
		padLevels(),
		consoleFormat({
			showMeta: true,
			metaStrip: ['timestamp', 'name', 'traceId'],
			inspectOptions: {
				depth: 5,
				colors: true,
				breakLength: 120,
			},
		})
	);
}

export const logger = createLogger({
	format: customFormat,
	transports: [
		new transports.Console({
			level: process.env.LOG_LEVEL ?? 'info',
			handleExceptions: true,
		}),
	],
});
