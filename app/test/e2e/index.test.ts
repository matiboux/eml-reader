import { test, expect } from '@playwright/test'

import {
	defaultLocale,
	otherLocale,
	getLocaleUrl,
} from '~test/helpers/i18n'

// Site description shown under the title on the home page, per locale.
// Keep in sync with `site.description` in `src/site.ts`.
const descriptions: Record<string, string> = {
	'en': 'Online tool to read and display the content of an EML file.',
	'fr': 'Outil en ligne pour lire et afficher le contenu d\'un fichier EML.',
}

test('has title', async ({ page }) =>
{
	await page.goto('/')
	await expect(page).toHaveTitle('EML Reader')
});

test('renders the default locale', async ({ page }) =>
{
	await page.goto(getLocaleUrl(defaultLocale))
	await expect(
		page.getByText(
			descriptions[defaultLocale]!,
			{ exact: true },
		),
	).toBeVisible()
});

test('renders a translated page', async ({ page }) =>
{
	test.skip(!otherLocale, 'Only one locale configured')

	await page.goto(getLocaleUrl(otherLocale!))
	await expect(
		page.getByText(
			descriptions[otherLocale!]!,
			{ exact: true },
		),
	).toBeVisible()
});

test('switches locale from the picker', async ({ page }) =>
{
	test.skip(!otherLocale, 'Only one locale configured')

	await page.goto(getLocaleUrl(defaultLocale))
	await page.locator(`.locale-switch a[href="${getLocaleUrl(otherLocale!)}"]`).click()
	await expect(page).toHaveURL(new RegExp(`${getLocaleUrl(otherLocale!)}$`))
	await expect(
		page.getByText(
			descriptions[otherLocale!]!,
			{ exact: true },
		),
	).toBeVisible()
});

test('shows the 404 page for unknown routes', async ({ page }) =>
{
	const response = await page.goto('/does-not-exist')
	expect(response?.status()).toBe(404)
});
