import { defineConfig } from 'astro/config'
import svelte from '@astrojs/svelte'
import tailwind from '@astrojs/tailwind'
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'

import { i18n } from '/src/config'

// https://astro.build/config
export default defineConfig({
	vite: {
		server: {
			watch: {
				usePolling: true,
			},
		},
		optimizeDeps: {
			esbuildOptions: {
				// Node.js global to browser globalThis
				define: {
					global: 'globalThis'
				},
				// Enable esbuild polyfill plugins
				plugins: [
					NodeGlobalsPolyfillPlugin({
						buffer: true
					})
				]
			}
		}
	},
	i18n: i18n,
	integrations: [
		svelte(),
		tailwind(),
	],
})
