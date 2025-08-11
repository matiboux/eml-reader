import { GITHUB_SHA, VERSION_TAG } from 'astro:env/client'

import type { Props as BaseProps } from '~/layouts/Base.astro'

export interface Site
{
	lang?: BaseProps['lang']
	title?: BaseProps['title']
	description?: BaseProps['description']
	version?: BaseProps['version']
	author?: BaseProps['author']
	keywords?: BaseProps['keywords']
	generator?: BaseProps['generator']
	themeColor?: BaseProps['themeColor']
	viewportScale?: BaseProps['viewportScale']
	favicon?: BaseProps['favicon']
	socialTitle?: BaseProps['socialTitle']
	socialDescription?: BaseProps['socialDescription']
	socialImage?: BaseProps['socialImage']
	socialUrl?: BaseProps['socialUrl']
	socialType?: BaseProps['socialType']
	socialTwitterCard?: BaseProps['socialTwitterCard']
}

export const site: Site = {
	lang: 'en',
	title: 'EML Reader',
	description: {
		'en': 'Online tool to read and display the content of an EML file.',
		'fr': 'Outil en ligne pour lire et afficher le contenu d\'un fichier EML.',
	},
	version: GITHUB_SHA || VERSION_TAG || 'dev',
	author: 'Matiboux',
	themeColor: '#ffffff',
	viewportScale: 1,
	socialTitle: true,
	socialDescription: true,
}
