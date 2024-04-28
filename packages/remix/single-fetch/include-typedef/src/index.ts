import { type SourceFile } from "ts-morph"
import { invariant } from "@epic-web/invariant"
import { resolve } from "../util/resolve.js"
import ts, { SyntaxKind, version } from "typescript"
function shouldProcessFile(sourceFile: SourceFile): boolean {
  // only if we're in a tsconfig.json file
  if (!sourceFile.getFilePath().endsWith("tsconfig.json")) {
    return false
  }

  return true
}

export function handleSourceFile(sourceFile: SourceFile): string | undefined {
  if (!shouldProcessFile(sourceFile)) {
    return undefined
  }

  const TYPEDEF = "node_modules/@remix-run/react/future/single-fetch.d.ts"
  const config = sourceFile.getFirstDescendantByKind(
    ts.SyntaxKind.ObjectLiteralExpression
  )

  invariant(config, "Expected tsconfig.json to be an object")
  if (!config.getProperty('"include"')) {
    config.addPropertyAssignment({
      name: '"include"',
      initializer: `[]`,
    })
  }

  const include = resolve(config.getProperty('"include"')!)
  invariant(
    include?.isKind(SyntaxKind.ArrayLiteralExpression),
    "Expected tsconfig.include to be an array"
  )

  if (
    !include
      ?.getElements()
      .find((element) => element.getText() === `"${TYPEDEF}"`)
  ) {
    include.addElement(`"${TYPEDEF}"`)
  }

  return sourceFile.getFullText()
}
