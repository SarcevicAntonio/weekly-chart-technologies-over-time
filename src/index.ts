import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'
const exec = promisify(execCb)

const library: Record<string, Record<string, number>> = {}

async function read_loc_per_filetypes(path: string, date: string) {
	console.error('# ' + date + ': Checking Out...')
	const { stderr: checkout_err } = await exec(
		`cd ${path} && git -c core.hooksPath=/dev/null checkout \`git rev-list -n 1 --before="${date} 23:59" main\``
	)
	if (checkout_err) throw new Error(checkout_err)
	console.error('# ' + date + ': Cleaning...')
	const { stderr: clean_err } = await exec(`cd ${path} && git clean -fd`)
	if (clean_err) throw new Error(clean_err)
	console.error('# ' + date + ': Counting...')
	const { stdout } = await exec(
		// eslint-disable-next-line no-useless-escape
		`cd ${path} && cloc --vcs=git --not-match-f="(package-lock\.json|\.svelte-kit|build|build\.new|static|dist)" --json .`
	)
	const output = JSON.parse(stdout)
	for (const [lang, { code }] of Object.entries(output) as [string, { code: number }][]) {
		if (lang === 'header' || lang === 'SUM') continue
		if (!library[lang]) library[lang] = {}
		library[lang][date] = code
	}
	console.error('# ' + date + ': Success! 🥳')
}

const checkpoints = [
	'2021-10-01',
	'2022-01-01',
	'2022-04-01',
	'2022-07-01',
	'2022-10-01',
	'2023-01-01',
	'2023-04-01',
	'2023-07-01',
	'2023-10-01',
]

async function main() {
	for (const checkpoint of checkpoints) {
		await read_loc_per_filetypes('../code', checkpoint)
	}
	console.log(library)
}

main()
