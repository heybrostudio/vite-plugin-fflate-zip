import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { cwd } from 'node:process'
import { cyan, getRootByPackageName, gray, green, red } from '@heybrostudio/utils'
import { zipSync } from 'fflate'
import type { PluginOption } from 'vite'
import path from 'node:path';

export interface ZipPackageFile {
	/**
	 * The resolved file or directory
	 */
    src: string;
	/**
	 * set a prefix for the file or directory
	 */
    prefix?:string;
	/**
	 * Files to be excluded
	 */
	excludedFiles?: string[]
}

export interface Options {
	/**
	 * Input Directory
	 * @default `dist`
	 */
	inDir?: string

	/**
	 * A list of files or directories with preifx and exclusions.
	 */
	files?: ZipPackageFile[];

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
	excludedFiles?: string[]
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
function buildZipData(files: ZipPackageFile[]) {
	const zipData = new Map()
	
	/**
	 * Build zip structure from a file or directory entry
	 * @param file 
	 */
	function _buildStructure(file: ZipPackageFile) {

		if (file.src.indexOf(".") > -1) {
			//build an individual file
			_buildFile(file.src,path.join(file.prefix || "", path.basename(file.src)) );
		} else {
			//build a directory
			_build(file.src, file.src, file.prefix, file.excludedFiles);
		}
	}

	function _buildFile(resolvedFile: string, prefix: string) {
		const ext = resolvedFile.slice(resolvedFile.lastIndexOf('.') + 1).toLowerCase();
		zipData.set(prefix, [
			readFileSync(resolvedFile),
			{
				level: !ALREADY_COMPRESSED.includes(ext) ? 6 : 0,
			},
		])
	}

	function _build(dir: string, baseDir: string, prefix = '', excludedFiles: string[] = []) {
		const allPaths = readdirSync(dir)

		for (const file of allPaths) {
			if (excludedFiles?.includes(file)) continue;
			const resolvedFile = join(dir, file);
			if (statSync(resolvedFile).isDirectory()) {
				_build(resolvedFile, baseDir, prefix, excludedFiles);
			} else {
				//Add file replacing the base directory with a prefix path if set.
				_buildFile(resolvedFile, path.join(prefix, path.relative(baseDir, resolvedFile)));
			}
		}
	}

	//Create zip structure from a set of files and directories
	files.map(file => {
		_buildStructure(file);
	});

	return zipData;
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
				if (inDir && !existsSync(inDir)) throw new Error(`"${inDir}" folder does not exist!`)
				// validate output directory. If it does not exist, create
				if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })

				// Build zip data
				const startTime = Date.now()

				//add in directory to files list if set
				if (!options.files && inDir) {
					options.files = [
						{
							src: join(ROOT_DIR, inDir),
							//set exclude file list if set
							excludedFiles: options.excludedFiles
						}
					];
				}

				const zipData = buildZipData(options.files!);

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
