import { BinlogListener } from 'src/binlogListener';
import { BootstrapOptions } from 'src/options';
import { Position, PositionTracker } from 'src/positionTracker';
import exitHook from 'exit-hook';
import { getBinlogPublisher } from 'src/binlogPublisher';
import { BinlogProcessor } from 'src/binlogProcessor';

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
	const binlogProcessor = new BinlogProcessor(
		options.processing,
		binlogListener,
		binlogPublisher,
		positionTracker
	);
	const subscription = binlogProcessor.start();

	exitHook(() => {
		subscription.unsubscribe();
	});
};
