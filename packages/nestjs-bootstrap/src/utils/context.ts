import { INestApplicationContext } from '@nestjs/common';
import { AsyncContext } from '@nestjs-steroids/async-context';

export async function runInContext(
	app: INestApplicationContext,
	context: Record<string, any>,
	handler: () => Promise<any>
) {
	const asyncContext = app.get(AsyncContext);

	return asyncContext.registerCallback(async () => {
		for (const [key, value] of Object.entries(context)) {
			asyncContext.set(key, value);
		}
		return handler();
	});
}
