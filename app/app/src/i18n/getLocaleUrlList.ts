import { getAbsoluteLocaleUrlList } from 'astro:i18n'

import getLocaleByUrl from './getLocaleByUrl'
import getUrlWithoutLocale from './getUrlWithoutLocale'

function getLocaleUrlList(url: URL | string, excludeLocale?: string): {
	locale: string,
	url: string
}[]
{
	const pathname = typeof url === 'string' ? url : url.pathname
	const list =
		(getAbsoluteLocaleUrlList(getUrlWithoutLocale(pathname)) as string[])
			.map(url =>
				({
					locale: getLocaleByUrl(url),
					url,
				})
			)

	console.log('list', list)

	if (excludeLocale !== undefined)
	{
		return list.filter(({ locale }) => locale !== excludeLocale)
	}

	return list
}

export default getLocaleUrlList
