import { defineConfig } from 'vite'
import fflateZip from '../src'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		fflateZip({
			excludedFiles: ['favicon.ico'],
			onArchived() {
				console.log('✓ ✓ ✓ Zip done! ✓ ✓ ✓')
			},
		}),
	],
	build: {
		lib: {
			entry: resolve(__dirname, 'src/main.js'),
			name: 'HeyBroStudio',
			fileName: 'hey-bro-studio',
		},
	},
})
