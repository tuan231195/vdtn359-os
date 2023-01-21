import { ValidateBy } from 'class-validator';

export const IS_FOREIGN_KEY = 'IsForeignKey';

export const IsForeignKey = (model: any) => {
	return ValidateBy({
		name: IS_FOREIGN_KEY,
		async: true,
		validator: {
			async validate(value: any) {
				if (typeof value !== 'number') {
					return false;
				}
				if (value <= 0) {
					return false;
				}

				return !!(await model.count({
					where: {
						id: value,
					},
				}));
			},
			defaultMessage() {
				return '$property not found';
			},
		},
	});
};
