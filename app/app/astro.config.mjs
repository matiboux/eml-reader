import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'
import tailwind from '@astrojs/tailwind'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

import { i18n } from '/src/config'

// https://astro.build/config
export default defineConfig({
	site: process.env.ASTRO_SITE_URL || undefined,
	base: process.env.ASTRO_BASE_PATH || undefined,
	build: {
		assetsPrefix: process.env.ASTRO_ASSETS_PREFIX || undefined,
	},
	vite: {
		optimizeDeps: {
			esbuildOptions: {
				// Node.js global to browser globalThis
				define: {
					global: 'globalThis',
				},
				// Enable esbuild polyfill plugins
				plugins: [
					NodeGlobalsPolyfillPlugin({
						buffer: true,
					}),
				],
			},
		},
	},
	i18n: i18n,
	integrations: [
		svelte(),
		tailwind(),
	],
})
