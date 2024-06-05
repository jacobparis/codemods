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

test('resource route with loader function', async () => {
	const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}
`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default defineRoute({ loader })

		`),
	)
})

test('resource route with loader function and existing imports', async () => {
	const input = await prettier(`

import { json } from "@remix-run/react"

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return json({
		session: null,
	})
}
`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { json, defineRoute } from "@remix-run/react"

async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return json({
		session: null,
	})
}

export default defineRoute({ loader })

		`),
	)
})

test('resource route with action function', async () => {
	const input = await prettier(`

export async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}
`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default defineRoute({ action })

		`),
	)
})

test('resource route with loader and action function', async () => {
	const input = await prettier(`

export async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default defineRoute({ action, loader })

		`),
	)
})

test('route with component', async () => {
	const input = await prettier(`

export default function() {
	return <div>hello</div>
}

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

function Component() {
	return <div>hello</div>
}	

export default defineRoute({ Component })

		`),
	)
})

test('route with component named Component', async () => {
	const input = await prettier(`

export default function Component() {
	return <div>hello</div>
}

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

function Component() {
	return <div>hello</div>
}	

export default defineRoute({ Component })

		`),
	)
})

test('route with component with custom name', async () => {
	const input = await prettier(`

export default function SomeRoute() {
	return <div>hello</div>
}

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

function SomeRoute() {
	return <div>hello</div>
}	

export default defineRoute({ Component: SomeRoute })

		`),
	)
})

test('route with const component named Component', async () => {
	const input = await prettier(`

const Component = function () {
	return <div>hello</div>
}
export default Component

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

const Component = function () {
	return <div>hello</div>
}

export default defineRoute({ Component })

		`),
	)
})

test('route with let component named SomeRoute', async () => {
	const input = await prettier(`

let SomeRoute = () => {
	return <div>hello</div>
}

export default SomeRoute

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

let SomeRoute = () => {
	return <div>hello</div>
}

export default defineRoute({ Component: SomeRoute })

		`),
	)
})

test('route with component and loader', async () => {
	const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default function Component() {
	return <div>hello</div>
}

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

function Component() {
	return <div>hello</div>
}

export default defineRoute({ loader, Component })

		`),
	)
})

test('route with component and action and loader', async () => {
	const input = await prettier(`

export async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default function Component() {
	return <div>hello</div>
}	

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

function Component() {
	return <div>hello</div>
}

export default defineRoute({ action, loader, Component })

		`),
	)
})

test('route with variable component and action and loader', async () => {
	const input = await prettier(`

export let action = async ({ request }: ActionFunctionArgs) => {
	await requireAnonymous(request)
	return {
		session: null,
	}
};

export const loader = async function({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
};

let SomeRoute = function Blag() {
	return <div>hello</div>
};

export default SomeRoute

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

let action = async ({ request }: ActionFunctionArgs) => {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

const loader = async function({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

let SomeRoute = function Blag() {
	return <div>hello</div>
}

export default defineRoute({ action, loader, Component: SomeRoute })

		`),
	)
})

test('route with loader and empty defineRoute', async () => {
	const input = await prettier(`

import { defineRoute } from "@remix-run/react"

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default defineRoute()

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default defineRoute({ loader })

		`),
	)
})

test('route with loader and empty object defineRoute', async () => {
	const input = await prettier(`

import { defineRoute } from "@remix-run/react"

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default defineRoute({})

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default defineRoute({ loader })

		`),
	)
})

test('route with loader and defineRoute with action', async () => {
	const input = await prettier(`

import { defineRoute } from "@remix-run/react"

async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default defineRoute({ action })

`)

	expect(await prettier(transform(input)!)).toEqual(
		await prettier(`

import { defineRoute } from "@remix-run/react"

async function action({ request }: ActionFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default defineRoute({ action, loader })

		`),
	)
})
