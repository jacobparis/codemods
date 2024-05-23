import {
	SyntaxKind,
	Symbol,
	Node,
	Identifier,
	VariableDeclaration,
	ExportAssignment,
	PropertyAssignment,
} from 'ts-morph'
import { invariant } from '@epic-web/invariant'

export function resolve(symbolOrNode: Symbol | Node) {
	if (symbolOrNode instanceof Symbol) {
		const node = symbolOrNode.getDeclarations()[0]
		if (!node) {
			throw new Error('Node not found')
		}
		return resolve(node)
	}

	return resolveNode(symbolOrNode)

	function resolveNode(node: Node): Node | undefined {
		if (!node) {
			throw new Error('Node not found')
		}
		switch (node.getKind()) {
			case SyntaxKind.ExportAssignment: {
				const exportAssignment = node as ExportAssignment
				const expression = exportAssignment.getExpression()

				return resolveNode(expression)
			}
			case SyntaxKind.PropertyAssignment: {
				const propertyAssignment = node as PropertyAssignment
				const initializer = propertyAssignment.getInitializer()
				if (initializer) {
					return resolveNode(initializer) // Recursively resolve initializers
				}
				break
			}
			case SyntaxKind.VariableDeclaration: {
				const variableDeclaration = node as VariableDeclaration
				const initializer = variableDeclaration.getInitializer()
				if (initializer) {
					return resolveNode(initializer) // Recursively resolve initializers
				}
				break
			}
			case SyntaxKind.Identifier: {
				const identifier = node as Identifier
				const definitionNodes = identifier.getDefinitionNodes()
				if (definitionNodes.length > 0) {
					invariant(definitionNodes[0], 'Node not found')
					return resolveNode(definitionNodes[0]) // Resolve the identifier definition
				}
				break
			}
			case SyntaxKind.CallExpression: {
				return node // Directly return if it's a CallExpression
			}
		}
		return node // Default return, especially for object literals and direct values
	}
}
