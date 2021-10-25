import { exec as execute_ } from "child_process"
import fs from "fs"
import semver from "semver"
import { promisify } from "util"

const { readFile } = fs.promises
const execute = promisify(execute_)

;(async () => {
	const [ packageJSONFile, { stdout: gitGetHashStdout } ] = await Promise.all([ readFile("package.json", { encoding: "utf-8" }), execute("git rev-parse --short HEAD") ])
	console.log((await execute(`npm version ${semver.inc(JSON.parse(packageJSONFile).version, "minor")}-${gitGetHashStdout.trim()}`)).stdout)
})()
