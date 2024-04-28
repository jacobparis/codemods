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

describe('add future flag', () => {
	test('no future property', async () => {
		const input = await prettier(`

export default defineConfig({
	plugins: [
		remix({}),
	],
})

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export default defineConfig({
	plugins: [
		remix({
			future: {
				unstable_singleFetch: true,
			}
		})
	]
})

		`),
		)
	})

	test('empty future property', async () => {
		const input = await prettier(`

export default defineConfig({
	plugins: [
		remix({
			future: {},
		}),
	],
})

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export default defineConfig({
	plugins: [
		remix({
			future: {
				unstable_singleFetch: true,
			}
		})
	]
})

		`),
		)
	})

	test('already set to false', async () => {
		const input = await prettier(`

export default defineConfig({
	plugins: [
		remix({
			future: {
				unstable_singleFetch: false,
			}
		}),
	],
})
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export default defineConfig({
	plugins: [
		remix({
			future: {
				unstable_singleFetch: true,
			}
		})
	]
})
		`),
		)
	})

	test('with other flags', async () => {
		const input = await prettier(`

export default defineConfig({
	plugins: [
		remix({
			future: {
				unstable_dev: true,
				beta: true,
			}
		}),
	],
})
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export default defineConfig({
	plugins: [
		remix({
			future: {
				unstable_dev: true,
				beta: true,
				unstable_singleFetch: true,
			}
		})
	]
})
		`),
		)
	})
})
