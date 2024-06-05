This codemod adds a `defineRoute({ action, loader, Component })` export to your
routes and removes the old exports.

This does not inline the functions into `defineRoute`, which is probably what
you'll want long term. But this is a quick way to get started with the new
`defineRoute` API with a minimum of changes.

## Usage

You can use this codemod with the following command:

```sh
codemod remix/2/route-exports-to-define-route
```

## Examples

Input:

```diff
import {
  useLoaderData,
+  defineRoute
} from '@remix-run/react'

-export async function loader({ request, params }: LoaderFunctionArgs) {
+async function loader({ request, params }: LoaderFunctionArgs) {
  // ...
}

-export async function action({ request, params }: ActionFunctionArgs) {
+async function action({ request, params }: ActionFunctionArgs) {
  // ...
}

-export default function SomeRoute() {
+function SomeRoute() {
  let data = useLoaderData<typeof loader>()
  // ...
}

+export default defineRoute({ loader, action, Component: SomeRoute })
```
