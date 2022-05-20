import { BinlogListener } from 'src/binlogListener';
import { BootstrapOptions } from 'src/options';
import { Position, PositionTracker } from 'src/positionTracker';
import exitHook from 'exit-hook';
import { getBinlogPublisher } from 'src/binlogPublisher';

export const bootstrap = async (options: BootstrapOptions) => {
	let positionTracker: PositionTracker | null = null;
	let position: Position | null = null;

	if (options.storage) {
		positionTracker = new PositionTracker(options.storage.s3);
	}

	if (options.listener?.startAtEnd) {
		position = {
			startAtEnd: true,
		};
	} else if (positionTracker) {
		position = await positionTracker.getPosition();
	}

	if (position) {
		console.info('Resuming from position', position);
	}

	const binlogPublisher = getBinlogPublisher(options.publisher);

	const binlogListener = new BinlogListener(options.listener);
	binlogListener.start(position ?? undefined);
	const subscription = binlogListener.handleBatch(
		options.processing,
		async (items) => {
			await binlogPublisher.publishItems(items);
			if (positionTracker) {
				const lastItemPosition = items[items.length - 1]?.position;
				if (lastItemPosition) {
					await positionTracker.commit(lastItemPosition);
				}
			}
		}
	);

	exitHook(() => {
		subscription.unsubscribe();
	});
};
