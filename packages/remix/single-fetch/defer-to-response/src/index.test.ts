import { handleSourceFile } from './index.js'
import { Project } from 'ts-morph'
import { describe, expect, test } from 'vitest'
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

describe('remove defer', () => {
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

	test('loader with defer', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	return defer({
		user: fetch(process.env.DATABASE_URL).then(r => r.json()),
	})
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	return {
		user: fetch(process.env.DATABASE_URL).then(r => r.json()),
	}
}

export default function Page() { }
		`),
		)
	})

	test('defer in variable', async () => {
		const input = await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	const user = fetch(process.env.DATABASE_URL).then(r => r.json()),
	
	const body = defer({
		user,
	})

	return body
}

export default function Page() { }
`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

export async function loader({ request }: LoaderFunctionArgs) {
	const user = fetch(process.env.DATABASE_URL).then(r => r.json()),
	
	const body = {
		user,
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
	return defer({
		session: getSession(),
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
		session: getSession(),
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds response to {} args', async () => {
		const input = await prettier(`

export async function loader({}: LoaderFunctionArgs) {
	return defer({
		session: getSession(),
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
		session: getSession(),
	}
}

export default function Page() { }
		`),
		)
	})

	test('adds response to {} args in const', async () => {
		const input = await prettier(`

export const loader = async ({}: LoaderFunctionArgs) => {
	return defer({
		session: getSession(),
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
		session: getSession(),
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
	
	return defer({
		session: getSession(),
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
		session: getSession(),
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
	
	return defer({
		session: getSession(),
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
		session: getSession(),
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

		return defer({
			session: getSession(),
		}, {
			headers: {
				'Content-Type': 'application/defer',
			}
		})
	}

	export default function Page() { }
	`)

		expect(await prettier(transform(input)!)).toEqual(
			await prettier(`

	export async function loader({ request, response }: LoaderFunctionArgs) {
		await requireAnonymous(request)
		response!.headers.set('Content-Type', 'application/defer')

		return {
			session: getSession(),
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
			'Content-Type': 'application/defer',
		}

		return defer({
			session: getSession(),
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
			'Content-Type': 'application/defer',
		}
		response!.headers.set('Content-Type', 'application/defer')

		return {
			session: getSession(),
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
	return defer({ status: 'success' } as const, { headers: toastHeaders })
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
	return defer({ status: 'success' } as const, { headers: toastHeaders })
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

	return defer({
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
				return defer(
					{ result: submission.reply() },
					{
						status: submission.status === 'error' ? 400 : 200,
					},
				)
			}
		
			await deleteIssues(submission.value)
	
			return defer(
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
