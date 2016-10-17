/* ────────────────────────╮
 │ @thebespokepixel/badges │
 ╰─────────────────────────┴──────────────────────────────────────────────────── */

import _ from 'lodash'
import pkgConf from 'pkg-conf'
import readPkg from 'read-pkg-up'
import remark from 'remark'
import node from 'unist-builder'
import squeeze from 'remark-squeeze-paragraphs'
import bespoke from './lib/providers/bespoke'
import {cc, ccCoverage} from './lib/providers/codeclimate'
import {david, davidDev} from './lib/providers/david'
import gitter from './lib/providers/gitter'
import inch from './lib/providers/inch'
import npm from './lib/providers/npm'
import rollup from './lib/providers/rollup'
import snyk from './lib/providers/snyk'
import travis from './lib/providers/travis'

const services = {
	bespoke,
	gitter,
	'code-climate': cc,
	'code-climate-coverage': ccCoverage,
	david,
	'david-dev': davidDev,
	inch,
	npm,
	rollup,
	snyk,
	travis
}

function parseQueue(collection, providers, user) {
	if (Array.isArray(collection)) {
		const badges = collection.map(content => parseQueue(content, providers, user))
		badges.push(node('break'))
		return node('paragraph', badges)
	}
	if (_.isObject(collection)) {
		return _.map(collection, (content, title) => {
			return node('root', [
				node('heading', {
					depth: 5
				}, [
					node('text', title)
				]),
				parseQueue(content, providers, user)
			])
		})
	}
	if (!services[collection]) {
		throw new Error(`${collection} not found`)
	}
	return services[collection](providers[collection], user)
}

/**
 * Render project badge configuration as markdown.
 * @param  {String} context The desired render context i.e: `readme`, `docs` as
 *                          defined in `package.json`.
 * @return {Promise}        A promise that resolves to the markdown formatted output.
 */
export default function render(context) {
	return Promise.all([
		pkgConf('badges'),
		readPkg()
	]).then(configArray => {
		const config = configArray[0]
		const pkg = configArray[1].pkg
		if (!config.name || !config.github || !config.npm) {
			throw new Error('Badges requires at least a package name, github repo and npm user account.')
		}
		if (!config[context]) {
			throw new Error(`${context} is not provided in package.json.`)
		}
		if (!config.providers) {
			throw new Error('At least one badge provider must be specified.')
		}

		return {
			user: {
				name: config.name,
				fullName: pkg.name,
				scoped: /^@.+?\//.test(pkg.name),
				github: {
					user: config.github,
					slug: `${config.github}/${config.name}`
				},
				npm: {
					user: config.npm
				}
			},
			providers: _.forIn(_.defaults(config.providers, {
				bespoke: {
					title: 'bespoke',
					text: 'badge',
					color: 'red',
					link: false
				},
				gitter: {
					title: 'gitter',
					room: 'help'
				},
				'code-climate': {
					title: 'code-climate'
				},
				'code-climate-coverage': {
					title: 'coverage'
				},
				david: {
					title: 'david',
					branch: 'master'
				},
				'david-dev': {
					title: 'david-developer',
					branch: 'master'
				},
				inch: {
					title: 'inch',
					branch: 'master',
					style: 'shields'
				},
				npm: {
					title: 'npm',
					icon: true
				},
				rollup: {
					title: 'rollup',
					icon: true
				},
				snyk: {
					title: 'snyk'
				},
				travis: {
					title: 'travis',
					branch: 'master'
				}
			}), value => _.defaults(value, {
				style: config.style || 'flat',
				icon: false
			})),
			queue: config[context]
		}
	}).then(config => {
		return node('root', parseQueue(config.queue, config.providers, config.user))
	})
}

render('readme').then(md => {
	// console.dir(md, {
	// 	depth: 10
	// })
	console.log(remark().use(squeeze).stringify(md))
})
