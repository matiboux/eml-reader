import type { Diff } from '~/i18n/types.d.ts'

import type { DefaultLocaleKeys } from './types.d.ts'

const locale = {
	'Welcome!': 'Bienvenue !',
	// Footer
	'Open source project': 'Projet open source',
	'See the source code on': 'Voir le code source sur',
	'Built with': 'Construit avec',
	'served by': 'servi par',
	'Made with love by': 'Créé avec amour par',
	'Data privacy': 'Confidentialité des données',
	'No data is collected or processed over the network or on any server.':
		'Aucune donnée n\'est collectée ou traitée sur le réseau ou sur un serveur.',
	'All data is processed locally in your browser, and stays on your own device.':
		'Toutes les données sont traitées localement dans votre navigateur et restent sur votre propre appareil.',
	'This website uses no cookies and does no tracking.':
		'Ce site web n\'utilise pas de cookies et ne fait pas de suivi.',
} as const

export default locale satisfies
	// Static type check for missing keys
	Readonly<Record<Diff<DefaultLocaleKeys, keyof typeof locale>, string>> &
	// Static type check for extra keys
	Readonly<Record<Diff<keyof typeof locale, DefaultLocaleKeys>, never>>
