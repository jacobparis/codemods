# Remix / Single Fetch / Include Typedef

Adds the typings for Single Fetch to your tsconfig.json file.

- [Type Inference Remix Docs](https://remix.run/docs/en/main/guides/single-fetch#type-inference)

## Usage

You can use this codemod with the following command:

```sh
codemod remix/single-fetch/include-typedef --include="tsconfig.json"
```

Note that you must specify the `--include` flag because codemod does not target
`json` files by default.

## Examples

```diff
{
  "include": [
    // ...
+   "node_modules/@remix-run/react/future/single-fetch.d.ts"
  ]
}
```

## Affected files

- `tsconfig.json`
