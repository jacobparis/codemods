# codemods

A collection of codemods

Run these using the [Codemod CLI](https://codemod.com)

```sh
npm i -g codemod
```

```sh
codemod remix/single-fetch/enable-flag
```

## Local usage

Clone the repository and open one of the codemod folders.

- `npm install`
- `npm build`
- Copy the codemod directory path

And then in the project where you want to apply the codemod, **in a clean git
branch so you can easily revert the changes**, run the following:

```sh
codemod --source=<codemod-directory-path>
```
