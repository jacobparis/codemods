import { CallExpression, SyntaxKind, type SourceFile } from 'ts-morph'
import { getRemixConfig } from '../util/getRemixConfig.js'
import { invariant } from '@epic-web/invariant'
import { resolve } from '../util/resolve.js'
function shouldProcessFile(sourceFile: SourceFile): boolean {
	if (!sourceFile.getFilePath().endsWith('vite.config.ts')) {
		return false
	}

	return true
}

export function handleSourceFile(sourceFile: SourceFile): string | undefined {
	if (!shouldProcessFile(sourceFile)) {
		return undefined
	}

	const config = getRemixConfig(sourceFile)

	if (!config.getProperty('future')) {
		// add future property
		config.addPropertyAssignment({
			name: 'future',
			initializer: '{}',
		})
	}

	const future = resolve(config.getProperty('future')!)
	invariant(
		future?.isKind(SyntaxKind.ObjectLiteralExpression),
		'Expected an object literal argument in defineConfig.',
	)

	const flag = future.getProperty('unstable_singleFetch')

	if (!flag) {
		future.addPropertyAssignment({
			name: 'unstable_singleFetch',
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
