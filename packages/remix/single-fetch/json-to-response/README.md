# Remix / Single Fetch / Json to response

This codemod removes Remix's `json()` helper function to take advantage of the
new Single Fetch features.

## Usage

You can use this codemod with the following command:

```sh
codemod remix/single-fetch/json-to-response
```

## Examples

Input:

```ts
export async function loader({}: LoaderFunctionArgs) {
	return json(
		{
			session: getSession(),
		},
		{
			status: 200,
			headers: {
				'Content-Type': 'application/json',
			},
		},
	)
}
```

Output:

```ts
export async function loader({ response }: LoaderFunctionArgs) {
	response.status = 200
	response.headers.set('Content-Type', 'application/json')
	return {
		session: getSession(),
	}
}
```

## Headers can't be set to a function

If headers are set by a function, we can't automatically map that to the
`response` object.

In this case it'll leave a TODO comment so this can be resolved manually

```ts
export async function action({ request }: ActionFunctionArgs) {
	const toastHeaders = createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})
	return json({ status: 'success' } as const, { headers: toastHeaders })
}
```

```ts
export async function action({ request, response }: ActionFunctionArgs) {
	const toastHeaders = createToastHeaders({
		title: 'Deleted',
		description: 'Your connection has been deleted.',
	})
	// TODO: response.headers = toastHeaders
	return { status: 'success' } as const
}
```

## If response is already in scope

If the function already has a variable named `response`, such as from another
fetch operation, it will conflict with the new `response` argument.

In this case, it will rename your existing `response` to `response2`, which you
may want to rename manually to `fetchResponse` or something more descriptive.

```ts
export async function loader({ request }: LoaderFunctionArgs) {
	const response = await fetch(process.env.DATABASE_URL).then(r => r.json())

	return json(
		{
			session: response.data,
		},
		{
			status: 200,
		},
	)
}
```

will be transformed to

```ts
export async function loader({ request, response }: LoaderFunctionArgs) {
	const response2 = await fetch(process.env.DATABASE_URL).then(r => r.json())
	response.status = 200

	return {
		session: response2.data,
	}
}
```
