import type { DefaultLocale } from '~/i18n/types.d.ts'

export const localeKeys = [
	'Welcome!',
	// Footer
	'Open source project',
	'See the source code on',
	'Built with',
	'served by',
	'Made with love by',
	'Data privacy',
	'No data is collected or processed over the network or on any server.',
	'All data is processed locally in your browser, and stays on your own device.',
	'This website uses no cookies and does no tracking.',
] as const satisfies DefaultLocale

export type DefaultLocaleConst = typeof localeKeys
