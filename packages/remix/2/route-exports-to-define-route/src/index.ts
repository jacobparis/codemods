import {
	ModifierableNode,
	Node,
	ObjectLiteralExpression,
	ParameterDeclaration,
	Symbol,
	type SourceFile,
} from 'ts-morph'
import { resolve, resolveToIdentifier } from '../util/resolve.js'
import { SyntaxKind } from 'typescript'
function shouldProcessFile(sourceFile: SourceFile): boolean {
	return true
}

export function handleSourceFile(sourceFile: SourceFile): string | undefined {
	if (!shouldProcessFile(sourceFile)) {
		return undefined
	}

	let replacedExports = []
	const routeExports = sourceFile
		.getExportSymbols()
		.filter(symbol => ['loader', 'action'].includes(symbol.getName()))

	for (const routeExport of routeExports) {
		replacedExports.push(routeExport.getName())
	}
	setExports(routeExports, false)

	const defaultExport = sourceFile.getDefaultExportSymbol()
		? resolve(sourceFile.getDefaultExportSymbol()!)
		: undefined
	// there is a default export
	// if it's a function declaration then it's a component
	if (
		defaultExport?.isKind(SyntaxKind.FunctionExpression) ||
		defaultExport?.isKind(SyntaxKind.ArrowFunction)
	) {
		const identifier = resolveToIdentifier(sourceFile.getDefaultExportSymbol()!)
		if (identifier?.isKind(SyntaxKind.Identifier)) {
			const name = identifier.getText()
			if (name !== 'Component') {
				replacedExports.push(`Component: ${name}`)
			} else {
				replacedExports.push('Component')
			}
		}
		sourceFile
			.getDefaultExportSymbol()
			?.getDeclarations()[0]
			?.replaceWithText('')
	}

	if (defaultExport?.isKind(SyntaxKind.FunctionDeclaration)) {
		// if it doesn't have a name, set its name to Component
		const functionKeyword = defaultExport.getFirstChildByKindOrThrow(
			SyntaxKind.FunctionKeyword,
		)
		const functionKeywordChildIndex = functionKeyword.getChildIndex()

		const componentIdentifier = defaultExport.getChildAtIndexIfKind(
			functionKeywordChildIndex + 1,
			SyntaxKind.Identifier,
		)

		if (!componentIdentifier) {
			functionKeyword.replaceWithText('function Component')
			replacedExports.push('Component')
		} else {
			if (componentIdentifier.getText() !== 'Component') {
				replacedExports.push(`Component: ${componentIdentifier.getText()}`)
			} else {
				replacedExports.push('Component')
			}
		}

		defaultExport.setIsExported(false)
	}

	if (!defaultExport?.isKind(SyntaxKind.CallExpression)) {
		sourceFile.addExportAssignment({
			isExportEquals: false,
			expression: 'defineRoute()',
		})
	}

	const defineRouteCall = resolve(sourceFile.getDefaultExportSymbol()!)!
	if (defineRouteCall.isKind(SyntaxKind.CallExpression)) {
		const arg = defineRouteCall.getArguments()[0]

		if (arg?.isKind(SyntaxKind.ObjectLiteralExpression)) {
			for (const replacedExport of replacedExports) {
				addPropertyToDestructuredArg(arg, replacedExport)
			}
		} else {
			// like defineRoute()
			// -> defineRoute({ response })
			defineRouteCall.addArgument(`{ ${replacedExports.join(', ')} }`)
		}
	}

	if (replacedExports.length > 0) {
		// check if we've imported defineRoute
		// import { defineRoute } from '@remix-run/react'

		const defineRouteImport = sourceFile
			.getImportDeclarations()
			.find(
				declaration =>
					declaration.getModuleSpecifierValue() === '@remix-run/react',
			)

		// if not, we need to add it
		if (!defineRouteImport) {
			sourceFile.addImportDeclaration({
				isTypeOnly: false,
				moduleSpecifier: '@remix-run/react',
				namedImports: ['defineRoute'],
			})
		} else {
			// maybe we've imported other things but not it, if so add it
			// - import { json } from '@remix-run/react'
			// + import { json, defineRoute } from '@remix-run/react'

			const namedImports = defineRouteImport
				.getNamedImports()
				.map(imported => imported.getName())
			if (!namedImports.includes('defineRoute')) {
				defineRouteImport.addNamedImport('defineRoute')
			}
		}
	}

	return sourceFile.getFullText()
}

function addPropertyToDestructuredArg(
	args: ParameterDeclaration | ObjectLiteralExpression,
	property: string,
) {
	const objectLiteral = args.isKind(SyntaxKind.ObjectLiteralExpression)
		? args
		: args.getDescendantsOfKind(SyntaxKind.ObjectBindingPattern)[0]

	if (!objectLiteral) {
		throw new Error('Expected an object')
	}

	const lastElement = objectLiteral.isKind(SyntaxKind.ObjectLiteralExpression)
		? objectLiteral.getProperties().pop()
		: objectLiteral.getElements().pop()

	if (lastElement) {
		// like loader({ request })
		// -> loader({ response, request })
		lastElement.replaceWithText(`${lastElement.getText()}, ${property}`)
	} else {
		// like loader({})
		// -> loader({ response })
		objectLiteral.replaceWithText(`{ ${property} }`)
	}
}

function setExports(exportSymbols: Symbol[], flag: boolean) {
	let modifierableNodes: ModifierableNode[] = []
	exportSymbols.forEach(symbol => {
		symbol.getDeclarations().forEach(declaration => {
			let node: Node | undefined = declaration
			while (node && node.getKind() !== SyntaxKind.SourceFile) {
				if (
					node.isKind(SyntaxKind.VariableStatement) ||
					node.isKind(SyntaxKind.FunctionDeclaration) ||
					node.isKind(SyntaxKind.ClassDeclaration)
				) {
					if (node.hasModifier('export')) {
						modifierableNodes.push(node)
						break
					}
				}
				node = node.getParent()
			}
		})
	})

	for (const node of modifierableNodes) {
		node.toggleModifier('export', flag)
	}
}
