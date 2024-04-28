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
	await requireAnonymous(request)
	return json({
		session: null,
	})
}

`),
		).toBeUndefined()
	})

	test('action and loader with json', async () => {
		const input = await prettier(`

export const action = async ({ request }) => {
	const form = await request.formData()

	const submission = parseWithZod(form, {
		schema: ThemeFormSchema,
	})

	return json({ submission: submission.reply() })
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return json({
		session: null,
	})
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export const action = async ({ request }) => {
	const form = await request.formData()

	const submission = parseWithZod(form, {
		schema: ThemeFormSchema,
	})

	return { submission: submission.reply() }
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default function Page() { }
		`),
		)
	})

	test('loader with json', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return json({
		session: null,
	})
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	return {
		session: null,
	}
}

export default function Page() { }
		`),
		)
	})

	test('removes json from variable', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	
	const body = json({
		session: null,
	})

	return body
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)

	const body = {
		session: null,
	}

	return body
}

export default function Page() { }
		`),
		)
	})

	test('adds response to no args', async () => {
		const input = await prettier(`

export async function loader() {
	return json({
		session: null,
	}, {
		status: 200
	})
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader(args: LoaderFunctionArgs) {
	args.response!.status = 200
	return {
		session: null,
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds response to {} args', async () => {
		const input = await prettier(`

export async function loader({}: LoaderFunctionArgs) {
	return json({
		session: null,
	}, {
		status: 200
	})
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ response }: LoaderFunctionArgs) {
	response!.status = 200
	return {
		session: null,
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds response to {} args in const', async () => {
		const input = await prettier(`

export const loader = async ({}: LoaderFunctionArgs) => {
	return json({
		session: null,
	}, {
		status: 200
	})
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export const loader = async ({ response }: LoaderFunctionArgs) => {
	response!.status = 200
	return {
		session: null,
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds response to { request } args', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	
	return json({
		session: null,
	}, {
		status: 200
	})
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	await requireAnonymous(request)
	response!.status = 200

	return {
		session: null,
	}
}

export default function Page() { }
		`),
		)
	})

	test('uses response from variable args', async () => {
		const input = await prettier(`

export async function loader(args: LoaderFunctionArgs) {
	await requireAnonymous(args.request)
	
	return json({
		session: null,
	}, {
		status: 200
	})
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader(args: LoaderFunctionArgs) {
	await requireAnonymous(args.request)
	args.response!.status = 200

	return {
		session: null,
	}
}

export default function Page() { }
		`),
		)
	})

	test('sets header from response', async () => {
		const input = await prettier(`

	export async function loader({ request }: LoaderFunctionArgs) {
		await requireAnonymous(request)

		return json({
			session: null,
		}, {
			headers: {
				'Content-Type': 'application/json',
			}
		})
	}

	export default function Page() { }
	`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

	export async function loader({ request, response }: LoaderFunctionArgs) {
		await requireAnonymous(request)
		response!.headers.set('Content-Type', 'application/json')

		return {
			session: null,
		}
	}

	export default function Page() { }
			`),
		)
	})

	test('sets header from response in variable', async () => {
		const input = await prettier(`

	export async function loader({ request }: LoaderFunctionArgs) {
		await requireAnonymous(request)

		const headers = {
			'Content-Type': 'application/json',
		}

		return json({
			session: null,
		}, {
			headers
		})
	}

	export default function Page() { }
	`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

	export async function loader({ request, response }: LoaderFunctionArgs) {
		await requireAnonymous(request)
		
		const headers = {
			'Content-Type': 'application/json',
		}
		response!.headers.set('Content-Type', 'application/json')

		return {
			session: null,
		}
	}

	export default function Page() { }
			`),
		)
	})

	test('adds todo for function headers', async () => {
		const input = await prettier(`

export async function action({ request }: ActionFunctionArgs) {
	const toastHeaders = createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})
	return json({ status: 'success' } as const, { headers: toastHeaders })
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function action({ request, response }: ActionFunctionArgs) {
	const toastHeaders = createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})
	/* TODO: response!.headers = toastHeaders */
	return { status: 'success' } as const
}

export default function Page() { }
		`),
		)
	})

	test('adds todo for await headers', async () => {
		const input = await prettier(`

export async function action({ request }: ActionFunctionArgs) {
	const toastHeaders = await createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})
	return json({ status: 'success' } as const, { headers: toastHeaders })
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function action({ request, response }: ActionFunctionArgs) {
	const toastHeaders = await createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})
	/* TODO: response!.headers = toastHeaders */
	return { status: 'success' } as const
}

export default function Page() { }
		`),
		)
	})

	test('changes existing response in scope', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	const response = await fetch(process.env.DATABASE_URL).then(r => r.json())

	return json({
		session: response.data
	}, {
		status: 200
	})
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request, response }: LoaderFunctionArgs) {
	const response2 = await fetch(process.env.DATABASE_URL).then(r => r.json())
	response!.status = 200

	return {
		session: response2.data
	}
}

export default function Page() { }
		`),
		)
	})

	test('comments multiline headers', async () => {
		const input = await prettier(`
			export async function action({ request }: ActionFunctionArgs) {
				const submission = await parseRequest(request, {
					schema: DeleteIssueSchema,
				})
			
				if (submission.status !== 'success') {
					return json(
						{ result: submission.reply() },
						{
							status: submission.status === 'error' ? 400 : 200,
						},
					)
				}
			
				await deleteIssues(submission.value)

				return json(
					{ result: submission.reply() },
					{
						headers: await createToastHeaders({
							description: \`Deleted \${submission.value.issueIds.length} issues\`,
							type: 'success',
						}),
					},
				)
			}

			export default function Page() { }
		`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

			export async function action({ request, response }: ActionFunctionArgs) {
				const submission = await parseRequest(request, {
					schema: DeleteIssueSchema,
				})
			
				if (submission.status !== 'success') {
					response!.status = submission.status === 'error' ? 400 : 200
					return { result: submission.reply() }
				}
			
				await deleteIssues(submission.value)
				/* TODO: response!.headers = await createToastHeaders({
            description: \`Deleted \${submission.value.issueIds.length} issues\`,
            type: "success",
          }) */

				return { result: submission.reply() }
			}

			export default function Page() { }
		`),
		)
	})
})
