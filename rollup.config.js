import babel from "@rollup/plugin-babel"
import nodeResolve from "@rollup/plugin-node-resolve"
import { readdir as readDirectory } from "fs/promises"
import preserveShebang from "rollup-plugin-preserve-shebang"
import { terser } from "rollup-plugin-terser"
import packageConfig from "./package.json"

const sourceDirectory = `src`
const external = []

if (`dependencies` in packageConfig)
	external.push(...Object.keys(packageConfig.dependencies))

const findFilesPromise = findFiles(sourceDirectory)

/** @type {(command: Record<string, unknown>) => Promise<import("rollup").RollupOptions>} */
export default async () => ({
	input: Object.fromEntries(
		(await findFilesPromise)
			.filter(path => path.endsWith(`.ts`) && !path.endsWith(`.d.ts`))
			.map(path => [ path.slice(sourceDirectory.length + 1, -3), path ])
	),
	output: {
		dir: `dist`,
		chunkFileNames: `[name]-.js`,
		generatedCode: `es2015`,
		interop: `auto`,
		compact: true
	},
	plugins: [
		babel({ babelHelpers: `bundled`, extensions: [ `.ts` ] }),
		nodeResolve({ extensions: [ `.ts` ] }),
		terser({ keep_classnames: true, keep_fnames: true }),
		preserveShebang()
	],
	external: external.map(name => new RegExp(`^${name}(?:/|$)`))
	// preserveEntrySignatures: "allow-extension"
})

/**
 * @param {string} path the directory to start recursively finding files in
 * @param {string[] | ((name: string) => boolean)} filter either a blacklist or a filter function that returns false to ignore file name
 * @param {string[]} paths
 * @returns promise that resolves to array of found files
 */
 async function findFiles(path, filter = [], paths = []) {
	const filterFunction = Array.isArray(filter) ? name => !filter.includes(name) : filter

	await Promise.all((await readDirectory(path, { withFileTypes: true })).map(async dirent => {
		if (!filterFunction(dirent.name))
			return

		const direntPath = `${path}/${dirent.name}`

		if (dirent.isDirectory())
			await findFiles(direntPath, filterFunction, paths)
		else if (dirent.isFile())
			paths.push(direntPath)
	}))

	return paths
}
