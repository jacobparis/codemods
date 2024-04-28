# Remix / Single Fetch / Enable Flag

Enables the single fetch flag in the Remix Vite config.

## Usage

You can use this codemod with the following command:

```sh
codemod remix/single-fetch/enable-flag --include="vite.config.ts"
```

Specifying the `--include` flag is optional but recommended so codemod doesn't
have to look through your whole project.

## Examples

```diff
return defineConfig({
+ future: {
+   unstable_singleFetch: true
+ }
})
```

## Affected files

- `vite.config.ts`
