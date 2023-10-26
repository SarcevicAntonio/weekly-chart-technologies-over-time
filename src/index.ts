import { promisify } from 'node:util'
import { exec as execCb } from 'node:child_process'
const exec = promisify(execCb)

const library: Record<string, Record<string, number>> = {}

async function read_loc_per_filetypes(path: string) {
	const { stdout } = await exec(`cd ${path} && cloc --vcs=git --json .`)
	const output = JSON.parse(stdout)
	console.log(stdout, output)
	for (const [lang, { code }] of Object.entries(output) as [string, { code: number }][]) {
		if (lang === 'header') continue
		if (!library[lang]) library[lang] = {}
		library[lang]['2023-10-26'] = code
	}
}

async function main() {
	await read_loc_per_filetypes('../code')
	console.log(library)
}

main()
