import { promisify } from 'node:util'
import { exec as execCb } from 'node:child_process'
const exec = promisify(execCb)

console.log('Hello World')

async function read_loc_per_filetypes(path) {
	const { stdout } = await exec('cloc --vcs=git --json ' + path)
}
