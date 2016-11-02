/* eslint unicorn/no-process-exit:0, import/extensions:0 */

import {resolve} from 'path'
import {readFileSync} from 'fs'
import _ from 'lodash'
import {simple} from 'trucolor'
import {truwrap} from 'truwrap'
import {stripIndent, TemplateTag, replaceSubstitutionTransformer} from 'common-tags'
import {box} from '@thebespokepixel/string'
import meta from '@thebespokepixel/meta'
import yargs from 'yargs'
import updateNotifier from 'update-notifier'
import {createConsole} from 'verbosity'
import remark from 'remark'
import gap from 'remark-heading-gap'
import squeeze from 'remark-squeeze-paragraphs'
import badges from '..'

const pkg = require('../package.json')

const console = createConsole({outStream: process.stderr})
const clr = simple({format: 'sgr'})
const metadata = meta(__dirname)

const renderer = truwrap({
	right: 4,
	outStream: process.stderr
})

const colorReplacer = new TemplateTag(
	replaceSubstitutionTransformer(
		/([a-zA-Z]+?)[:/|](.+)/,
		(match, colorName, content) => `${clr[colorName]}${content}${clr[colorName].out}`
	)
)

const title = box(colorReplacer`${'title|compile-readme'}${`dim| │ ${metadata.version(3)}`}`, {
	borderColor: 'yellow',
	margin: {
		top: 1
	},
	padding: {
		bottom: 0,
		top: 0,
		left: 2,
		right: 2
	}
})

const usage = stripIndent(colorReplacer)`
	Inject project badges into a tagged markdown-formatted source file.

	Usage:
	${'command|compile-readme'} ${'option|[options]'} ${'operator|>'} ${'argument|outputFile'}`

const epilogue = colorReplacer`${'green|© 2016'} ${'brightGreen|The Bespoke Pixel.'} ${'grey|Released under the MIT License.'}`

yargs.strict().options({
	h: {
		alias: 'help',
		describe: 'Display help.'
	},
	v: {
		alias: 'version',
		count: true,
		describe: 'Print version to stdout. -vv Print name & version.'
	},
	V: {
		alias: 'verbose',
		count: true,
		describe: 'Be verbose. -VV Be loquacious.'
	},
	c: {
		alias: 'context',
		default: 'readme',
		describe: 'The named badges context in package.json.'
	},
	u: {
		alias: 'usage',
		describe: 'Path to a markdown usage example'
	},
	color: {
		describe: 'Force color output. Disable with --no-color'
	}
}).wrap(renderer.getWidth())

const argv = yargs.argv

if (!(process.env.USER === 'root' && process.env.SUDO_USER !== process.env.USER)) {
	updateNotifier({
		pkg
	}).notify()
}

if (argv._.length === 0) {
	argv.help = true
}

if (argv.help) {
	renderer.write(title).break(2)
	renderer.write(usage)
	renderer.break(2)
	renderer.write(yargs.getUsageInstance().help())
	renderer.break()
	renderer.write(epilogue)
	renderer.break(1)
	process.exit(0)
}

if (argv.version) {
	process.stdout.write(metadata.version(argv.version))
	process.exit(0)
}

if (argv.verbose) {
	switch (argv.verbose) {
		case 1:
			console.verbosity(4)
			console.log(`${clr.title}Verbose mode${clr.title.out}:`)
			break
		case 2:
			console.verbosity(5)
			console.log(`${clr.title}Extra-Verbose mode${clr.title.out}:`)
			console.yargs(argv)
			break
		default:
			console.verbosity(3)
	}
}

const source = resolve(argv._[0])
console.debug('Source path:', source)

const template = _.template(readFileSync(source))

badges(argv.context)
	.then(badges => {
		const content = {
			badges,
			usage: ''
		}
		if (argv.usage) {
			content.usage = readFileSync(resolve(argv.usage))
		}
		process.stdout.write(remark().use(gap).use(squeeze).process(template(content)).contents)
	})
