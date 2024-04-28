import { handleSourceFile } from './index.js'
import { Project, ScriptKind } from 'ts-morph'
import { describe, expect, test } from 'vitest'
import { extname } from 'node:path'
import { format } from 'prettier'

const prettier = (text: string) => format(text, { parser: 'json' })
const transform = (beforeText: string) => {
	const project = new Project({
		useInMemoryFileSystem: true,
		skipFileDependencyResolution: true,
		compilerOptions: {
			allowJs: true,
		},
	})

	const actualSourceFile = project.createSourceFile(
		'tsconfig.json',
		beforeText,
		{
			scriptKind: ScriptKind.JSON,
		},
	)

	const actual = handleSourceFile(actualSourceFile)

	return actual
}

describe('add typedefs', () => {
	test('no include property', async () => {
		const input = await prettier(`{}`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

{
	"include": [
		"node_modules/@remix-run/react/future/single-fetch.d.ts"
	]
}

		`),
		)
	})

	test('empty include property', async () => {
		const input = await prettier(`

{
	"include": []
}

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

{
	"include": [
		"node_modules/@remix-run/react/future/single-fetch.d.ts"
	]
}

		`),
		)
	})

	test('with other includes', async () => {
		const input = await prettier(`

{
	"include": ["other.ts"]
}
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

{
	"include": [
		"other.ts",
		"node_modules/@remix-run/react/future/single-fetch.d.ts"
	]
}
		`),
		)
	})

	test('with comments and trailing commas', async () => {
		const input = await prettier(`

{
	// this is a comment
	"include": ["other.ts"],
}
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

{
	// this is a comment
	"include": [
		"other.ts",
		"node_modules/@remix-run/react/future/single-fetch.d.ts"
	],
}
		`),
		)
	})

	test('already has typedef', async () => {
		const input = await prettier(`

{
	"include": [
		"other.ts",
		"node_modules/@remix-run/react/future/single-fetch.d.ts"
	]
}

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

{
	"include": [
		"other.ts",
		"node_modules/@remix-run/react/future/single-fetch.d.ts"
	]
}

		`),
		)
	})

	test('with big config', async () => {
		const input = `{
	"compilerOptions": {
		"outDir": "./dist",
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"isolatedModules": true,
		"module": "NodeNext",
		"skipLibCheck": true,
		"strict": true,
		"target": "ES6",
		"allowJs": true
	},
	"include": [
		"./src/**/*.ts",
		"./src/**/*.js",
		"./test/**/*.ts",
		"./test/**/*.js"
	],
	"exclude": ["node_modules", "./dist/**/*"],
	"ts-node": {
		"transpileOnly": true
	}
}`

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`{
	"compilerOptions": {
		"outDir": "./dist",
		"esModuleInterop": true,
		"forceConsistentCasingInFileNames": true,
		"isolatedModules": true,
		"module": "NodeNext",
		"skipLibCheck": true,
		"strict": true,
		"target": "ES6",
		"allowJs": true
	},
	"include": [
		"./src/**/*.ts",
		"./src/**/*.js",
		"./test/**/*.ts",
		"./test/**/*.js",
		"node_modules/@remix-run/react/future/single-fetch.d.ts"
	],
	"exclude": ["node_modules", "./dist/**/*"],
	"ts-node": {
		"transpileOnly": true
	}
}`),
		)
	})
})
