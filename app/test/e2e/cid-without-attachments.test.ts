import { fileURLToPath } from 'node:url'

import { test, expect } from '@playwright/test'

const fixtureEml = fileURLToPath(new URL('./fixtures/cid-without-attachments.eml', import.meta.url))

// Regression cover: an HTML body that references a `cid:` image while the
// e-mail has no attachments used to throw while building the iframe document,
// which left the whole body blank.
test('renders a body that references a cid image without attachments', async ({ page }) =>
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

	await expect(
		page.frameLocator('.email-frame iframe').locator('#body-text'),
	).toHaveText('Body is visible')
})
