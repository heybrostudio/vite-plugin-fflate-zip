import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { cyan, getRootByPackageName, gray, green, red } from '@heybrostudio/utils'
import { zipSync } from 'fflate'
import type { PluginOption } from 'vite'

export interface Options {
	/**
	 * Input Directory
	 * @default `dist`
	 */
	inDir: string
	/**
	 * Output Directory
	 * @default `dist-zip`
	 */
	outDir: string
	/**
	 * Zip Archive Name.
	 * @default `${pkg.name}-${pkg.version}.zip`
	 */
	zipName: string
	/**
	 * Files to be excluded
	 */
	excludedFiles: string[]
	/**
	 * After creating the zip file execute
	 */
	onArchived: () => void
	/**
	 * Execute when an error occurs
	 * @param err Error message
	 */
	onError: (err: Error) => void
}

const ROOT_DIR = cwd()
const ALREADY_COMPRESSED = [
	'zip',
	'gz',
	'png',
	'jpg',
	'jpeg',
	'pdf',
	'doc',
	'docx',
	'ppt',
	'pptx',
	'xls',
	'xlsx',
	'heic',
	'heif',
	'7z',
	'bz2',
	'rar',
	'gif',
	'webp',
	'webm',
	'mp4',
	'mov',
	'mp3',
	'aifc',
]
function buildZipData(inDir: string, excludedFiles: string[] = []) {
	const fullInDir = join(ROOT_DIR, inDir)
	const zipData = new Map()

	function _build(dir: string) {
		const allPaths = readdirSync(dir)

		for (const path of allPaths) {
			if (excludedFiles?.includes(path)) continue

			const currentFullPath = join(dir, path)
			if (statSync(currentFullPath).isDirectory()) {
				_build(currentFullPath)
			} else {
				const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
				zipData.set(currentFullPath.replace(fullInDir, '').slice(1), [
					readFileSync(currentFullPath),
					{
						level: !ALREADY_COMPRESSED.includes(ext) ? 6 : 0,
					},
				])
			}
		}
	}

	_build(fullInDir)

	return zipData
}

const _options: Options = {
	inDir: '',
	outDir: 'dist-zip',
	zipName: '',
	excludedFiles: [],
	onArchived: () => {},
	onError: () => {},
}
export default function fflateZip(options: Partial<Options> = {}): PluginOption {
	return {
		name: 'vite-plugin-fflate-zip',
		apply: 'build',
		enforce: 'post',
		configResolved(config) {
			try {
				const { root, build } = config

				Object.assign(
					_options,
					{
						inDir: build.outDir,
					},
					{ ...options },
				)

				if (!_options?.zipName) {
					const pkgBuffer = readFileSync(join(root, 'package.json'))
					const pkg = JSON.parse(pkgBuffer.toString())
					_options.zipName = `${pkg.name}-${pkg.version}`
				}
			} catch (err) {
				if (err) red(err as string)

				_options.onError(err as Error)
			}
		},
		closeBundle() {
			try {
				// Get fflate version number
				const FFLATE = 'fflate'
				const fflateRoot = getRootByPackageName(FFLATE)
				const fflateVersion = JSON.parse(readFileSync(join(fflateRoot, 'package.json')).toString()).version

				console.log(cyan(`⚡️${FFLATE} v${fflateVersion}`), green('zipping for production...'))

				const { inDir, outDir, zipName } = _options
				// validate input directory
				if (!existsSync(inDir)) throw new Error(`"${inDir}" folder does not exist!`)
				// validate output directory. If it does not exist, create
				if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

				// Build zip data
				const startTime = Date.now()
				const zipData = buildZipData(inDir, options.excludedFiles)
				const zipOutput = zipSync(Object.fromEntries(zipData), { level: 6 })

				// Build .zip file
				const outputZipFile = join(ROOT_DIR, outDir, `${zipName}.zip`)
				writeFileSync(outputZipFile, zipOutput)

				// Get zip size
				const zipSize = `${(statSync(outputZipFile).size / 1024).toFixed(2)} kB`
				console.log(gray(`${outDir}/${cyan(zipName)}${cyan('.zip')}`), cyan(`| ${zipSize}`))

				_options.onArchived()
				console.log(green(`✓ zip in ${Date.now() - startTime}ms`))
			} catch (err) {
				if (err) console.log(red(err as string))

				_options.onError(err as Error)
			}
		},
	}
}
