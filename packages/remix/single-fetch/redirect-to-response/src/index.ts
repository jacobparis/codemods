import { Node, Statement, type SourceFile } from 'ts-morph'
import { invariant } from '@epic-web/invariant'
import { resolve } from '../util/resolve.js'
import ts, { SyntaxKind, version } from 'typescript'
function shouldProcessFile(sourceFile: SourceFile): boolean {
	if (!sourceFile.getFilePath().includes('routes')) {
		return false
	}

	// Do not modify resource routes
	if (!sourceFile.getDefaultExportSymbol()) {
		return false
	}

	return true
}

export function handleSourceFile(sourceFile: SourceFile): string | undefined {
	if (!shouldProcessFile(sourceFile)) {
		return undefined
	}

	const serverExports = sourceFile
		.getExportSymbols()
		.filter(symbol => ['loader', 'action'].includes(symbol.getName()))
		.map(symbol => resolve(symbol))

	for (const exportNode of serverExports) {
		if (!exportNode) continue
		let shouldRenameExistingResponseVars = false
		let argsName = ''

		const responseVarsInScope = exportNode
			.getDescendantsOfKind(SyntaxKind.Identifier)
			.filter(node => node.getText() === 'response')

		const helperCalls = exportNode
			.getDescendantsOfKind(SyntaxKind.CallExpression)
			.filter(call =>
				['redirect', 'redirectDocument'].includes(
					call.getExpression().getText(),
				),
			)

		for (const call of helperCalls) {
			const [body, options] = call.getArguments()
			let responseStatements = []

			// If the call argument is destructured, ensure that the `response` property is visible
			if (
				exportNode?.isKind(SyntaxKind.FunctionDeclaration) ||
				exportNode?.isKind(SyntaxKind.ArrowFunction)
			) {
				const functionArgs = exportNode.getParameters()[0]

				const destructuredArg = functionArgs?.getDescendantsOfKind(
					SyntaxKind.ObjectBindingPattern,
				)[0]

				if (destructuredArg) {
					if (
						!destructuredArg
							.getElements()
							.find(node => node.getText() === 'response')
					) {
						shouldRenameExistingResponseVars = true
						const lastElement = destructuredArg.getElements().pop()
						if (lastElement) {
							// like loader({ request })
							// -> loader({ response, request })
							lastElement.replaceWithText(`${lastElement.getText()}, response`)
						} else {
							// like loader({})
							// -> loader({ response })
							destructuredArg.replaceWithText(`{ response }`)
						}
					}
				} else {
					argsName = 'args'
					shouldRenameExistingResponseVars = true
					if (functionArgs) {
						// like loader(args)
						const arg = functionArgs?.getFirstDescendantByKind(
							SyntaxKind.Identifier,
						)

						if (arg) {
							argsName = arg?.getText()
						}
					} else {
						// like loader()
						// we need to add a parameter here

						exportNode.addParameter({
							name: argsName,
							type: 'LoaderFunctionArgs',
						})
					}
				}

				if (functionArgs?.isKind(SyntaxKind.ObjectLiteralExpression)) {
					functionArgs.addPropertyAssignment({
						name: 'response',
						initializer: '{}',
					})
				}
			}

			// Are there any variables already named `response`?
			// If so, replace them with `response2`
			if (shouldRenameExistingResponseVars) {
				responseVarsInScope.forEach(node => {
					if (node.getText() === 'response') {
						node.replaceWithText('response2')
					}
				})
			}

			const statusKey = options
				?.asKind(SyntaxKind.ObjectLiteralExpression)
				?.getProperty('status')
			if (statusKey?.isKind(SyntaxKind.PropertyAssignment)) {
				const statusAssignment = statusKey.getInitializer()

				if (statusAssignment) {
					responseStatements.push(
						`response!.status = ${statusAssignment.getText()};`,
					)
				}
			} else {
				responseStatements.push(`response!.status = 302;`)
			}

			if (body) {
				responseStatements.push(
					`response!.headers.set('Location', ${body.getText()});`,
				)
			}

			const headersKey = options
				?.asKind(SyntaxKind.ObjectLiteralExpression)
				?.getProperty('headers')
			if (
				headersKey?.isKind(SyntaxKind.PropertyAssignment) ||
				headersKey?.isKind(SyntaxKind.ShorthandPropertyAssignment)
			) {
				const headersValue = resolve(headersKey)

				if (headersValue?.isKind(SyntaxKind.ObjectLiteralExpression)) {
					for (const property of headersValue.getProperties()) {
						if (property.isKind(SyntaxKind.PropertyAssignment)) {
							const name = property.getNameNode()
							const value = property.getInitializer()

							// Ensure value is not undefined and add the corresponding header set statement
							if (value) {
								responseStatements.push(
									`response!.headers.set(${name.getText()}, ${value.getText()});`,
								)
							}
						}
					}
				} else if (
					headersValue?.isKind(SyntaxKind.AwaitExpression) ||
					headersValue?.isKind(SyntaxKind.CallExpression)
				) {
					// Can't set headers from a function
					const value = headersKey.getInitializer()?.getText()
					responseStatements.push(`/* TODO: response!.headers = ${value} */`)
				} else {
					console.log({ headersValue })
				}
			}

			void prependLines(
				call,
				responseStatements.map(line =>
					[argsName, line].filter(Boolean).join('.'),
				),
			)

			call.replaceWithText(`response`)
		}
	}

	return sourceFile.getFullText()
}

function prependLines(node: Node, lines: string[]) {
	// Prepend the call with all of the `response.status/header` lines
	const ancestorStatement = node.getFirstAncestorByKind(SyntaxKind.Block)

	const callStatement = node.getFirstAncestor(node => {
		if (node.isKind(SyntaxKind.ExpressionStatement)) return true
		if (node.isKind(SyntaxKind.ReturnStatement)) return true
		if (node.isKind(SyntaxKind.ThrowStatement)) return true

		return false
	}) as Statement

	if (ancestorStatement && callStatement) {
		const insertPosition = ancestorStatement
			.getStatements()
			.indexOf(callStatement)

		ancestorStatement.insertStatements(insertPosition, lines)
	} else {
		console.log(node.getAncestors().map(node => node.getKindName()))
	}
}
