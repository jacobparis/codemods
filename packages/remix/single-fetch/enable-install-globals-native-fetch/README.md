# Remix / Single Fetch / Enable installGlobals nativeFetch

Enables the nativeFetch flag in all instances of installGlobals

## Usage

You can use this codemod with the following command:

```sh
codemod remix/single-fetch/enable-install-globals-native-fetch
```

## Examples

```diff
return installGlobals({
+ nativeFetch: true
})
```

## Affected files

- Searches the whole codebase for instances of `installGlobals`
- Does not current check to see if they're imported from `@remix-run/node`,
  possible false positive if you have other functions with this name but the
  damage is limited as it will only add a property to the first arg.
