import { configDefaults, defineConfig } from 'vitest/config.js'

export default defineConfig({
	test: {
		include: [...configDefaults.include, '**/test/*.ts'],
	},
})
