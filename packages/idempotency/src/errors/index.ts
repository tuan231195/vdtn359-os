export class IdempotencyKeyAlreadyExists extends Error {
	constructor() {
		super('Idempotency key already exists');
	}
}

export class CurrentlyProcessingError extends Error {
	constructor() {
		super('Idempotency key is currently being processed');
	}
}
