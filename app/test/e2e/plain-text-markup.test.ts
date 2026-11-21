import { fileURLToPath } from 'node:url'

import { test, expect } from '@playwright/test'

const fixtureEml = fileURLToPath(new URL('./fixtures/plain-text-markup.eml', import.meta.url))

// Regression cover: a plain text body is shown as is. Markup-like text in it
// used to be parsed as HTML instead of being displayed.
test('shows markup in a plain text body literally', async ({ page }) =>
{
	await page.goto('/')

	// Wait for Astro island hydration, or the file input change can be lost.
	await expect
		.poll(
			async () => await page.locator('astro-island[ssr]').count(),
			{ message: 'islands should finish hydrating before interacting' },
		)
		.toBe(0)

	await page.locator('input[type="file"]').setInputFiles(fixtureEml)

	const body = page.frameLocator('.email-frame iframe').locator('pre')
	await expect(body).toHaveText('Use <b>bold</b> & <i>italic</i> tags.')
	await expect(body.locator('b, i')).toHaveCount(0)
})
