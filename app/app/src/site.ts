import type { I18nKeys } from '~/i18n/type.d.ts'

export interface Site
{
	title?: string
	description?: string | I18nKeys
	author?: string
	keywords?: string[]
	themeColor?: string
	favicon?: string
	lang?: string
}

export const site: Site = {
	title: 'EML Reader',
	description: {
		'en': 'Online tool to read and display the content of an EML file.',
		'fr': 'Outil en ligne pour lire et afficher le contenu d\'un fichier EML.',
	},
	author: 'Matiboux',
	themeColor: '#ffffff',
}
