import { handleSourceFile } from './index.js'
import { Project, ScriptKind } from 'ts-morph'
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

	const actualSourceFile = project.createSourceFile(
		'routes/route.tsx',
		beforeText,
	)

	const actual = handleSourceFile(actualSourceFile)

	return actual
}

describe('use alternate types', () => {
	test('import { UIMatch }', async () => {
		const input = await prettier(`

import { UIMatch } from "@remix-run/react";

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

import { UIMatch_SingleFetch } from "@remix-run/react";

		`),
		)
	})

	test('import { type UIMatch }', async () => {
		const input = await prettier(`

import { type UIMatch } from "@remix-run/react";

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

import { type UIMatch_SingleFetch } from "@remix-run/react";

		`),
		)
	})

	test('import type { UIMatch }', async () => {
		const input = await prettier(`

import type { UIMatch } from "@remix-run/react";

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

import type { UIMatch_SingleFetch } from "@remix-run/react";

		`),
		)
	})

	test('import type { MetaArgs }', async () => {
		const input = await prettier(`

import type { MetaArgs } from "@remix-run/react";

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

import type { MetaArgs_SingleFetch } from "@remix-run/react";

		`),
		)
	})

	test('as UIMatch', async () => {
		const input = await prettier(`

		let rootMatch = matches[0] as UIMatch<typeof loader>;

	`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

		let rootMatch = matches[0] as UIMatch_SingleFetch<typeof loader>;

		`),
		)
	})

	test('as MetaArgs', async () => {
		const input = await prettier(`

export function meta({
	data,
	matches,
}: MetaArgs<typeof loader, { root: typeof rootLoader }>) { }

`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export function meta({
	data,
	matches,
}: MetaArgs_SingleFetch<typeof loader, { root: typeof rootLoader }>) { }

		`),
		)
	})
})
