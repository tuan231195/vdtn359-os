export default function (babel) {
	const { types: t } = babel;
	return {
		name: 'babel-plugin-add-class-properties',
		visitor: {
			ClassDeclaration(path) {
				const properties = [];
				const staticVariables = [];
				path.traverse(addProperties());

				addClassProperty(path, '__PROPERTIES__', properties);
				addClassProperty(
					path,
					'__STATIC_PROPERTIES__',
					staticVariables
				);

				function addProperties() {
					return {
						ClassProperty(propertyPath) {
							const isStatic = propertyPath.node.static;
							const propertyName = safeGet(
								() => propertyPath.node.key.name
							);
							if (isStatic) {
								staticVariables.push(propertyName);
							} else {
								properties.push(propertyName);
							}
						},
					};
				}
			},
		},
	};

	function makeLiteralArrays(values) {
		return t.arrayExpression(
			values.length ? values.map((value) => t.stringLiteral(value)) : []
		);
	}

	function addClassProperty(path, name, values) {
		path.node.body.body.push(
			t.classProperty(
				t.identifier(name),
				makeLiteralArrays(values),
				undefined,
				undefined,
				undefined,
				true
			)
		);
	}
}

const safeGet = (fn) => {
	try {
		return fn();
	} catch (e: any) {
		if (e.name === 'TypeError') {
			return null;
		}
		throw e;
	}
};
