import _ from 'lodash'
import node from 'unist-builder'
import urlencode from 'urlencode'
import {renderIconSVG} from '../utils'

// [es-badge]: https://img.shields.io/badge/es2015-jsnext:main_✔-64CA39.svg?style=flat&logo=
// [es]: https://github.com/rollup/rollup/wiki/jsnext:main

export default function render(config) {
	return node('paragraph', [
		node('link', {
			title: _.upperFirst(config.title),
			url: `https://github.com/rollup/rollup/wiki/jsnext:main`
		}, [
			node('image', {
				alt: _.upperFirst(config.title),
				url: `https://img.shields.io/badge/es2015-${
					urlencode('jsnext:main_✔')
				}-64CA39.svg?style=${
					config.style
				}${config.icon && renderIconSVG('rollup')}`
			})
		]),
		node('text', ' ')
	])
}
