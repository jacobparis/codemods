import { type SourceFile } from 'ts-morph'
import { SyntaxKind } from 'typescript'
function shouldProcessFile(sourceFile: SourceFile): boolean {
	return true
}

export function handleSourceFile(sourceFile: SourceFile): string | undefined {
	if (!shouldProcessFile(sourceFile)) {
		return undefined
	}

	const changes = {
		UIMatch: 'UIMatch_SingleFetch',
		MetaArgs: 'MetaArgs_SingleFetch',
	}

	sourceFile.getImportDeclarations().forEach(importDeclaration => {
		// Get all named imports
		const namedImports = importDeclaration.getNamedImports()
		namedImports.forEach(namedImport => {
			// Replace 'UIMatch' with 'UIMatch_SingleFetch' where found
			if (namedImport.getName() in changes) {
				const change = changes[namedImport.getName() as keyof typeof changes]
				namedImport.setName(change)
			}
		})
	})

	// Search for and modify specific type assertions
	sourceFile.getDescendantsOfKind(SyntaxKind.TypeReference).forEach(typeRef => {
		const type = typeRef.getChildAtIndex(0)

		if (type.getText() in changes) {
			const change = changes[type.getText() as keyof typeof changes]
			type.replaceWithText(change)
		}
	})

	return sourceFile.getFullText()
}
