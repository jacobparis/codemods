import { Project } from 'ts-morph'
import { describe, expect, test } from 'vitest'
import { extname } from 'node:path'
import { getRemixConfig } from './getRemixConfig.js'

function process(text: string) {
	const project = new Project({
		useInMemoryFileSystem: true,
		skipFileDependencyResolution: true,
		compilerOptions: {
			allowJs: true,
		},
	})

	const source = project.createSourceFile('file.ts', text)

	return getRemixConfig(source)
}

describe('getRemixConfig', () => {
	test('throws when no plugins', () => {
		expect(() =>
			process(`

export default defineConfig({})

				`),
		).toThrow()
	})

	test('throws when no remix plugin', () => {
		expect(() =>
			process(`

export default defineConfig({
	plugins: []
})

				`),
		).toThrow()
	})

	test('has remix plugin with no config', () => {
		expect(() =>
			process(`

export default defineConfig({
	plugins: [
		remix()
	]
})

				`),
		).toThrow()
	})

	test('has multiple vite plugins', () => {
		const config = process(`

export default defineConfig({
	plugins: [millionjs(), remix({}), tsConfigPaths()]
})

		`)
		expect(config).toBeDefined()
		expect(config.getText()).toMatchObject({})
	})

	test('vite config is a variable', () => {
		const config = process(`

const config = {
	plugins: [remix({})]
}

export default defineConfig(config)

		`)
		expect(config).toBeDefined()
		expect(config.getText()).toMatchObject({})
	})

	test('vite has other properties', () => {
		const config = process(`

export default defineConfig({
	foo: 'bar',
	plugins: [remix({})]
})

		`)
		expect(config).toBeDefined()
		expect(config.getText()).toMatchObject({})
	})

	test('has config', () => {
		const config = process(`

export default defineConfig({
	plugins: [remix({
		foo: 'bar'
	})]
})

		`)
		expect(config).toBeDefined()
		expect(config.getText()).toMatchInlineSnapshot(`
			"{
					foo: 'bar'
				}"
		`)
	})
})
