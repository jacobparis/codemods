import { describe, migrate, withRepository } from 'codemod'
import path from 'node:path'
import semver from 'semver'

// __dirname isn't a global in ESM environments
const __dirname = path.dirname(new URL(import.meta.url).pathname)

/**
 * When `codemod recipe-name` is run, this function is called and applies
 * to the current working directory.
 */
export async function recipe({ codemod }) {
	// run published codemod
	await codemod('remix/enable-feature-flag', {
		params: {
			flagName: 'unstable_singleFetch',
		},
	})

	// run local codemod
	await codemod(path.join(__dirname, '..', 'include-typedef'), {
		include: 'tsconfig.json',
	})

	const { filesChanged, errors } = await codemod(
		'remix/single-fetch/json-to-response',
	)

	if (errors.length > 0) {
		console.error('Errors:', ...errors)
	} else {
		console.log('Files changed:', filesChanged)
	}

	await codemod('remix/single-fetch/defer-to-response')
	await codemod('remix/single-fetch/redirect-to-response')
}

describe('remix/single-fetch/recipe', () => {
	// migration applies to working directory where command was run
	migrate(async () => {
		await withRepository(
			'https://github.com/jacobparis/crud-bulk-operations',
			async ({
				branch,
				createPr,
				commit,
				codemod,
				fs, // like node:fs but operating on files in the repo
			}) => {
				await branch('migrate-single-fetch')

				// Workshop specific code to get projects to apply my migrations to
				let projectDirectories = [] as string[]
				const chapters = await fs.readdir('/exercises', { withFileTypes: true })
				for (const chapter of chapters) {
					if (chapter.isDirectory()) {
						const exercises = await fs.readdir(`/exercises/${chapter.name}`, {
							withFileTypes: true,
						})
						for (const exercise of exercises) {
							if (exercise.isDirectory()) {
								projectDirectories.push(
									`/exercises/${chapter.name}/${exercise.name}`,
								)
							}
						}
					}
				}

				await Promise.all(
					projectDirectories.map(cwd =>
						codemod('remix/single-fetch/recipe', { cwd }),
					),
				)
				await commit(projectDirectories, {
					message: 'apply migrations',
				})

				const packageJson = await fs.readJson('/package.json')
				packageJson.dependencies['@remix-run/react'] = '2.9.0'
				packageJson.dependencies['@remix-run/express'] = '2.9.0'
				packageJson.dependencies['@remix-run/node'] = '2.9.0'

				packageJson.devDependencies['@remix-run/dev'] = '2.9.0'
				packageJson.devDependencies['@remix-run/eslint-config'] = '2.9.0'

				packageJson.version = semver.increment(packageJson.version, 'major')

				await fs.writeJson('/package.json', packageJson, { spaces: 2 })
				await commit(['/package.json'], {
					message: 'bump version',
				})

				await createPr()
			},
		)
	})
})
