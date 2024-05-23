import { SyntaxKind, type SourceFile } from 'ts-morph'
import { resolve } from '../util/resolve.js'
function shouldProcessFile(sourceFile: SourceFile): boolean {
	return true
}

export function handleSourceFile(sourceFile: SourceFile): string | undefined {
	if (!shouldProcessFile(sourceFile)) {
		return undefined
	}

	const installGlobals = sourceFile
		.getDescendantsOfKind(SyntaxKind.CallExpression)
		.find(
			expression =>
				expression
					.getChildAtIndexIfKind(0, SyntaxKind.Identifier)
					?.getText() === 'installGlobals',
		)

	if (!installGlobals) {
		return undefined
	}

	const args = installGlobals.getArguments()
	if (args.length === 0) {
		// add { nativeFetch: true } to the arg
		installGlobals.addArgument('{ nativeFetch: true }')
		return sourceFile.getFullText()
	}

	const argument = args[0]

	if (!argument.isKind(SyntaxKind.ObjectLiteralExpression)) {
		return undefined
	}

	const flag = argument.getProperty('nativeFetch')

	if (!flag) {
		argument.addPropertyAssignment({
			name: 'nativeFetch',
			initializer: 'true',
		})
	} else {
		const resolvedFlag = resolve(flag)

		if (resolvedFlag?.isKind(SyntaxKind.FalseKeyword)) {
			resolvedFlag.setLiteralValue(true)
		}
	}

	return sourceFile.getFullText()
}
