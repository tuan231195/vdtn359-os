export const pipeline =
	(...fns) =>
	(...args) => {
		let result = fns[0](...args);
		for (const fn of fns.slice(1)) {
			result = fn(result);
		}
		return result;
	};

export const waterfall =
	(...fns) =>
	(...args) => {
		for (const fn of fns) {
			fn(...args);
		}
	};

export const compose = (...fns) => pipeline(...fns.reverse());

export const binary = (fn) => (x, y) => fn(x, y);
