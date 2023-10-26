import { addMonths, formatISO } from 'date-fns'
import { exec as execCb } from 'node:child_process'
import { promisify } from 'node:util'
const exec = promisify(execCb)

const USE_DATA_FILE = false

// generate a list of dates we want to checkout
const FIRST_DATE = '2021-09-01'
const LAST_DATE = '2023-10-01'
const checkpoints = [FIRST_DATE]
let index = 0
while (checkpoints.at(-1) !== LAST_DATE) {
	const current = checkpoints[index]
	checkpoints.push(formatISO(addMonths(new Date(current), 1), { representation: 'date' }))
	index++
}

/** holds lines of code per checkpoint per technology */
let library: Record<string, Record<string, number>>

async function checkout_and_cloc(path: string, date: string) {
	console.error('# ' + date + ': Checking Out...')
	await exec(
		`cd ${path} && git -c core.hooksPath=/dev/null checkout \`git rev-list -n 1 --before="${date} 23:59" main\``
	)
	console.error('# ' + date + ': Cleaning...')
	await exec(`cd ${path} && git clean -fd`)
	console.error('# ' + date + ': Counting...')
	const { stdout } = await exec(
		// eslint-disable-next-line no-useless-escape
		`cd ${path} && cloc --vcs=git --not-match-f="(package-lock\.json|\.svelte-kit|build|build\.new|static|dist)" --json .`
	)
	const output = JSON.parse(stdout)
	for (const [lang, { code }] of Object.entries(output) as [string, { code: number }][]) {
		if (lang === 'header' || lang === 'SUM') continue
		if (!library) library = {}
		if (!library[lang]) library[lang] = {}
		library[lang][date] = code
	}
	console.error('# ' + date + ': Success! 🥳')
}

async function main() {
	try {
		if (USE_DATA_FILE) library = (await import('./data.js')).default
	} catch (e) {
		/* empty */
	}
	if (!library) {
		for (const checkpoint of checkpoints) {
			await checkout_and_cloc('../code', checkpoint)
		}
	}

	// output data as CSV
	let header = 'tech'
	for (const checkpoint of checkpoints) {
		header += ',' + checkpoint
	}
	console.log(header)
	for (const [tech, loc_per_checkpoint] of Object.entries(library)) {
		let row = tech
		for (const checkpoint of checkpoints) {
			row += ',' + (loc_per_checkpoint[checkpoint] || '')
		}
		console.log(row)
	}
}

main()
