<p align="center">
  <a href="https://github.com/heybrostudio/vite-plugin-fflate-zip">
    <img alt="Vite plugin for packaging build folder into zip file via fflate" src="https://raw.githubusercontent.com/heybrostudio/vite-plugin-fflate-zip/main/.github/logo.svg" width="500">
  </a>
  <br><br>
  <samp>Vite plugin for packaging build folder into zip file via fflate.</samp>
  <p align="center"><img alt="NPM Version" src="https://img.shields.io/npm/v/vite-plugin-fflate-zip"></p>
</p>

## Install

```bash
bun add vite-plugin-fflate-zip -D

pnpm add vite-plugin-fflate-zip -D

npm install vite-plugin-fflate-zip -D

yarn add vite-plugin-fflate-zip -D
```

## Usage

```ts
// vite.config.ts
import { defineConfig } from "vite"
import fflateZip from "vite-plugin-fflate-zip"

export default defineConfig({
  plugins: [fflateZip()]
})
```

## Plugin Options

```ts
interface Options {
  /**
   * Input Directory
   * @default `dist`
   */
  inDir: string;
  /**
   * Output Directory
   * @default `dist-zip`
   */
  outDir: string;
  /**
   * Zip Archive Name. 
   * @default `${pkg.name}-${pkg.version}.zip`
   */
  zipName: string;
  /**
   * Files to be excluded
   */
  excludedFiles: string[];
  /**
   * After creating the zip file execute
   */
  onArchived: () => void;
  /**
   * Execute when an error occurs
   * @param err Error message
   */
  onError: (err: Error) => void;
}
```

## Develop

To install dependencies:

```bash
bun install
```

To run dev:

```bash
bun run dev
```

To testing at `example`:

```bash
bun run build:example
```

To build plugin:

```bash
bun run build
```

## Authors

- [@Caven](https://github.com/keyding)

## License
[MIT License](https://github.com/heybrostudio/bun-lib-starter/blob/main/LICENSE) © 2024-PRESENT Caven