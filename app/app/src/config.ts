import type { AstroUserConfig } from 'astro/config'

import type Site from '~/types/Site.d.ts'

export const site: Site = {
	title: 'EML Reader',
	description: {
		'en': 'Online tool to read and display the content of an EML file.',
		'fr': 'Outil en ligne pour lire et afficher le contenu d\'un fichier EML.',
	},
	author: 'Matiboux',
	themeColor: '#ffffff',
}

export const i18n =
{
	defaultLocale: 'en',
	locales: [
		{
			codes: ['en', 'en-US'],
			path: 'en',
		},
		{
			codes: ['fr', 'fr-FR'],
			path: 'fr',
		},
	],
	routing: {
		prefixDefaultLocale: false,
	},
} as const satisfies AstroUserConfig['i18n']
