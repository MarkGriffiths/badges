/* ────────────────────────╮
 │ @thebespokepixel/badges │
 ╰─────────────────────────┴─────────────────────────────────────────────────── */

import _ from 'lodash'
import pkgConf from 'pkg-conf'
import readPkg from 'read-pkg-up'
import remark from 'remark'
import node from 'unist-builder'
import gap from 'remark-heading-gap'
import squeeze from 'remark-squeeze-paragraphs'
import status from './lib/providers/status'
import aux1 from './lib/providers/aux-1'
import aux2 from './lib/providers/aux-2'
import {cc, ccCoverage} from './lib/providers/codeclimate'
import {david, davidDev} from './lib/providers/david'
import gitter from './lib/providers/gitter'
import inch from './lib/providers/inch'
import npm from './lib/providers/npm'
import rollup from './lib/providers/rollup'
import snyk from './lib/providers/snyk'
import greenkeeper from './lib/providers/greenkeeper'
import greenkeeperPro from './lib/providers/greenkeeper-pro'
import travis from './lib/providers/travis'
import travisCom from './lib/providers/travis-com'
import travisPro from './lib/providers/travis-pro'

const services = {
	status,
	aux1,
	aux2,
	gitter,
	'code-climate': cc,
	'code-climate-coverage': ccCoverage,
	david,
	'david-dev': davidDev,
	inch,
	npm,
	rollup,
	snyk,
	greenkeeper,
	'greenkeeper-pro': greenkeeperPro,
	travis,
	'travis-com': travisCom,
	'travis-pro': travisPro
}

function parseQueue(collection, providers, user) {
	if (Array.isArray(collection)) {
		const badges = _.flatten(collection.map(content => [parseQueue(content, providers, user), node('text', ' ')]))
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
 * @param  {Boolean} asAST  Render badges as {@link https://github.com/wooorm/mdast|MDAST}
 * @return {Promise}        A promise that resolves to the markdown formatted output.
 */
export default async function render(context, asAST = false) {
	const configArray = await Promise.all([
		pkgConf('badges'),
		readPkg()
	])
	const config = configArray[0]
	const pkg = configArray[1].package

	if (!config.name || !config.github || !config.npm) {
		throw new Error('Badges requires at least a package name, github repo and npm user account.')
	}

	if (!config[context]) {
		throw new Error(`${context} is not provided in package.json.`)
	}

	if (!config.providers) {
		throw new Error('At least one badge provider must be specified.')
	}

	const badgeQueue = {
		user: {
			name: config.name,
			fullName: pkg.name,
			scoped: /^@.+?\//.test(pkg.name),
			github: {
				user: config.github,
				slug: `${config.github}/${config.name}`
			},
			branch: config.branch,
			npm: config.npm,
			codeclimateToken: config.codeclimate,
			codeclimateRepoToken: config['codeclimate-repo'],
			travisToken: config.travis,
			greenkeeperToken: config.greenkeeper
		},
		providers: _.forIn(_.defaultsDeep(config.providers, {
			status: {
				title: 'status',
				text: 'badge',
				color: 'red',
				link: false
			},
			'aux-1': {
				title: 'aux1',
				text: 'badge',
				color: 'green',
				link: false
			},
			'aux-2': {
				title: 'aux2',
				text: 'badge',
				color: 'blue',
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
				title: 'david'
			},
			'david-dev': {
				title: 'david-developer'
			},
			inch: {
				title: 'inch',
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
			greenkeeper: {
				title: 'greenkeeper'
			},
			'greenkeeper-pro': {
				title: 'greenkeeper'
			},
			travis: {
				title: 'travis'
			},
			'travis-com': {
				title: 'travis'
			},
			'travis-pro': {
				title: 'travis'
			}
		}), value => _.defaultsDeep(value, {
			style: config.style || 'flat',
			icon: false
		})),
		queue: config[context]
	}

	const ast = node('root', parseQueue(badgeQueue.queue, badgeQueue.providers, badgeQueue.user))

	if (asAST) {
		return ast
	}

	return remark().use(gap).use(squeeze).stringify(ast)
}
