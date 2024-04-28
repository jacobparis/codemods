import { SourceFile, SyntaxKind, CallExpression } from 'ts-morph'
import { resolve } from './resolve.js'
import { invariant } from '@epic-web/invariant'

export function getRemixConfig(sourceFile: SourceFile) {
	const defaultExport = resolve(sourceFile.getDefaultExportSymbolOrThrow())
	invariant(
		defaultExport?.isKind(SyntaxKind.CallExpression),
		'Expected to export a call to defineConfig()',
	)

	const viteConfig = resolve(
		defaultExport.getArguments()[0]!.getSymbolOrThrow(),
	)

	invariant(
		viteConfig?.isKind(SyntaxKind.ObjectLiteralExpression),
		'Expected an object literal argument in defineConfig.',
	)

	const pluginProperty = viteConfig.getProperty('plugins')
	if (!pluginProperty) {
		throw new Error('Expected a plugins property in defineConfig.')
	}
	invariant(pluginProperty, 'Expected a plugins property in defineConfig.')

	const plugins = resolve(pluginProperty)

	invariant(
		plugins?.isKind(SyntaxKind.ArrayLiteralExpression),
		'Expected an array literal argument in defineConfig.',
	)

	const remixCall = plugins.getElements().find(element => {
		return (
			element.isKind(SyntaxKind.CallExpression) &&
			element.getExpression().getText() === 'remix'
		)
	}) as CallExpression | undefined

	invariant(remixCall, 'Could not find remix call in plugins array')

	const remixPluginArg = remixCall.getArguments()[0]
	invariant(remixPluginArg, 'Remix plugin has no config argument')
	const remixConfig = resolve(remixPluginArg)

	invariant(
		remixConfig?.isKind(SyntaxKind.ObjectLiteralExpression),
		'Expected an object literal argument in defineConfig.',
	)

	return remixConfig
}
