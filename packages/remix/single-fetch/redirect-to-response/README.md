# Remix / Single Fetch / Redirect to response

This codemod removes Remix's `redirect()` and `redirectDocument()` helper
functions to take advantage of the new Single Fetch features.

## Usage

You can use this codemod with the following command:

```sh
codemod remix/single-fetch/redirect-to-response
```

## Examples

Input:

```ts
export async function loader({ request }: LoaderFunctionArgs) {
	const user = await getUser(request)

	if (!user) {
		throw redirect('/login')
	}

	return user
}
```

Output:

```ts
export async function loader({ request, response }: LoaderFunctionArgs) {
	const user = await getUser(request)

	if (!user) {
		response.status = 302
		response.headers.set('Location', '/login')
		throw response
	}

	return user
}
```
