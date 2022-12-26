import * as ts from 'typescript';

export default function () {
	return (ctx: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
		function visitor(node: ts.Node): ts.Node {
			if (ts.isClassDeclaration(node)) {
				const properties: string[] = [];
				const staticVariables: string[] = [];
				node.forEachChild((childNode) => {
					if (isProperty(childNode)) {
						let isStatic = false;
						if (childNode.modifiers) {
							isStatic = childNode.modifiers.some(
								(modifier) =>
									modifier.kind ===
									ts.SyntaxKind.StaticKeyword
							);
						}
						const name = childNode.name!.getText();
						if (isStatic) {
							staticVariables.push(name);
						} else {
							properties.push(name);
						}
					}
				});
				// return ts.visitEachChild(node, visitor, ctx);
				return ts.updateClassDeclaration(
					node,
					node.decorators,
					node.modifiers,
					node.name,
					node.typeParameters,
					node.heritageClauses,
					[
						...node.members,
						createProperty('__PROPERTIES__', properties),
						createProperty('__STATIC_PROPERTIES', staticVariables),
					]
				);
			}
			return ts.visitEachChild(node, visitor, ctx);
		}
		return ts.visitEachChild(sourceFile, visitor, ctx);
	};

	function createProperty(name, values) {
		return ts.createProperty(
			undefined,
			[ts.createModifier(ts.SyntaxKind.StaticKeyword)],
			name,
			undefined,
			undefined,
			ts.createArrayLiteral(
				values.length
					? values.map((property) => ts.createLiteral(property))
					: []
			)
		);
	}
}

function isProperty(node): node is ts.ClassElement {
	return (
		ts.isClassElement(node) &&
		node.kind === ts.SyntaxKind.PropertyDeclaration
	);
}
