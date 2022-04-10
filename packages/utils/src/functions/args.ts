export const getArguments = function (func) {
	const args = func.toString().match(/([^(])*\(([^)]*)\)/)[2];

	// Split the arguments string into an array comma delimited.
	return args
		.split(',')
		.map((arg) =>
			// Ensure no inline comments are parsed and trim the whitespace.
			arg.replace(/\/\*.*\*\//, '').trim()
		)
		.filter(
			(arg) =>
				// Ensure no undefineds are added.
				arg
		);
};
