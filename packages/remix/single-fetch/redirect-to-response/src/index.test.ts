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

describe('remove response helpers', () => {
	test('ignores resource routes', async () => {
		expect(
			transform(`

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	if (!session) {
		return redirect('/login')
	}

	return {
		session
	}
}

`),
		).toBeUndefined()
	})

	test('adds response to no args', async () => {
		const input = await prettier(`

export async function loader() {
	const session = await requireAuth(request)

	if (!session) {
		throw redirect('/login')
	}

	return {
		session
	}
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader(args: LoaderFunctionArgs) {
	const session = await requireAuth(request)
	
	if (!session) {
		args.response!.status = 302
		args.response!.headers.set('Location', '/login')
		throw response
	}

	return {
		session
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds response to no args', async () => {
		const input = await prettier(`

export async function loader(args: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	if (!session) {
		throw redirect('/login')
	}

	return {
		session
	}
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader(args: LoaderFunctionArgs) {
	const session = await requireAuth(request)
	
	if (!session) {
		args.response!.status = 302
		args.response!.headers.set('Location', '/login')
		throw response
	}

	return {
		session
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds response to {} args', async () => {
		const input = await prettier(`

export async function loader({}: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	if (!session) {
		throw redirect('/login')
	}

	return {
		session
	}
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ response }: LoaderFunctionArgs) {
	const session = await requireAuth(request)
	
	if (!session) {
		response!.status = 302
		response!.headers.set('Location', '/login')
		throw response
	}

	return {
		session
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds response to {} args in const', async () => {
		const input = await prettier(`

export const loader = async ({}: LoaderFunctionArgs) => {
	const session = await requireAuth(request)

	if (!session) {
		throw redirect('/login')
	}

	return {
		session
	}
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export const loader = async ({ response }: LoaderFunctionArgs) => {
	const session = await requireAuth(request)
	
	if (!session) {
		response!.status = 302
		response!.headers.set('Location', '/login')
		throw response
	}

	return {
		session
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds response to { request } args', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	if (!session) {
		throw redirect('/login')
	}

	return {
		session
	}
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	const session = await requireAuth(request)
	
	if (!session) {
		response!.status = 302
		response!.headers.set('Location', '/login')
		throw response
	}

	return {
		session
	}
}

export default function Page() { }
		`),
		)
	})

	test('sets extra headers', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	if (!session) {
		throw redirect('/login', {
			headers: {
				'X-Test': 'test',
			}
		})
	}

	return {
		session
	}
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	const session = await requireAuth(request)
	
	if (!session) {
		response!.status = 302
		response!.headers.set('Location', '/login')
		response!.headers.set('X-Test', 'test')
		throw response
	}

	return {
		session
	}
}

export default function Page() { }
		`),
		)
	})

	test('sets extra headers from variable', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	const headers = {
		'X-Test': 'test',
	}

	if (!session) {
		throw redirect('/login', { headers })
	}

	return {
		session
	}
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	const session = await requireAuth(request)
	
	const headers = {
		'X-Test': 'test',
	}

	if (!session) {
		response!.status = 302
		response!.headers.set('Location', '/login')
		response!.headers.set('X-Test', 'test')
		throw response
	}

	return {
		session
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds todo for function headers', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	const toastHeaders = createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})

	if (!session) {
		throw redirect('/login', { headers: toastHeaders })
	}

	return {
		session
	}
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	const toastHeaders = createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})

	if (!session) {
		response!.status = 302
		response!.headers.set('Location', '/login')
		/* TODO: response!.headers = toastHeaders */
		throw response
	}

	return {
		session
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds todo for await headers', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	const toastHeaders = await createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})

	if (!session) {
		throw redirect('/login', { headers: toastHeaders })
	}

	return {
		session
	}
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	const session = await requireAuth(request)

	const toastHeaders = await createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})

	if (!session) {
		response!.status = 302
		response!.headers.set('Location', '/login')
		/* TODO: response!.headers = toastHeaders */
		throw response
	}

	return {
		session
	}
}

export default function Page() { }
		`),
		)
	})

	test('changes existing response in scope', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	const response = await fetch(process.env.DATABASE_URL).then(r => r.json())

	if (!response) {
		throw redirect('/login')
	}

	return { data: response }
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	const response2 = await fetch(process.env.DATABASE_URL).then(r => r.json())

	if (!response2) {
		response!.status = 302
		response!.headers.set('Location', '/login')
		throw response
	}

	return { data: response2 }
}

export default function Page() { }
		`),
		)
	})

	test('does not change existing response param', async () => {
		const input = await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	const user = await requireAuth(request)

	if (!user) {
		throw redirect('/login')
	}

	response!.status = 200
	return { user }
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	const user = await requireAuth(request)

	if (!user) {
		response!.status = 302
		response!.headers.set('Location', '/login')
		throw response
	}

	response!.status = 200
	return { user }
}

export default function Page() { }
		`),
		)
	})
})
