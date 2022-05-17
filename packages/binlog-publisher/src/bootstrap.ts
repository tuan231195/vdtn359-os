import { BinlogListener } from 'src/binlogListener';
import { BootstrapOptions } from 'src/options';
import { Position, PositionTracker } from 'src/positionTracker';

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

	const binlogListener = new BinlogListener(options.listener);
	binlogListener.start(position ?? undefined);
	binlogListener.subscribe({
		next: (e) => console.info(JSON.stringify(e)),
	});
};
