import { handleSourceFile } from './index.js'
import { Project } from 'ts-morph'
import { describe, expect, test } from 'vitest'
import { extname } from 'node:path'
import { format } from 'prettier'

const prettier = (text: string) => format(text, { parser: 'typescript' })
const transform = (beforeText: string) => {
	const project = new Project({
		useInMemoryFileSystem: true,
		skipFileDependencyResolution: true,
		compilerOptions: {
			allowJs: true,
		},
	})

	const actualSourceFile = project.createSourceFile('path.ts', beforeText)

	const actual = handleSourceFile(actualSourceFile)

	return actual
}

describe('add native fetch', () => {
	test('no args', async () => {
		const input = await prettier(`

installGlobals()

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

installGlobals({ nativeFetch: true })

		`),
		)
	})

	test('empty object', async () => {
		const input = await prettier(`

installGlobals({})

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

installGlobals({
	nativeFetch: true
})

		`),
		)
	})

	test('already set to false', async () => {
		const input = await prettier(`

installGlobals({ nativeFetch: false })

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

installGlobals({ nativeFetch: true })

		`),
		)
	})

	test('with other flags', async () => {
		const input = await prettier(`

installGlobals({
	otherFlag: true,
})

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

installGlobals({
	otherFlag: true,
	nativeFetch: true
})

		`),
		)
	})
})
