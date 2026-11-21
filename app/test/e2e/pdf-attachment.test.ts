import { fileURLToPath } from 'node:url'

import { test, expect } from '@playwright/test'

const fixtureEml = fileURLToPath(new URL('./fixtures/pdf-attachment.eml', import.meta.url))

// Regression cover for the pdf.js v4 -> v6 upgrade. Both breaking changes it
// crossed fail silently in the browser: a removed `renderTextLayer()` leaves an
// empty text layer, and the `--scale-factor` -> `--total-scale-factor` rename
// leaves the text runs positioned off-screen. Neither shows up in a build.
test('renders a PDF attachment with a positioned text layer', async ({ page }) =>
{
	await page.goto('/')

	// Astro drops the `ssr` attribute from an island once it hydrates. Without
	// waiting, setInputFiles can fire before Svelte has attached its change
	// handler; the event is then lost and the attachments tab never appears.
	// Fast machines hide this, but a cold CI run trips over it.
	await expect
		.poll(
			async () => await page.locator('astro-island[ssr]').count(),
			{ message: 'islands should finish hydrating before interacting' },
		)
		.toBe(0)

	await page.locator('input[type="file"]').setInputFiles(fixtureEml)

	await page.locator('nav.menu a', { hasText: 'Attachments' }).click()
	await page.locator('.attachment-btn').click()

	// The document parsed and reported its page count.
	await expect(page.locator('.pdf-nav p.min-width-2')).toHaveText(/1\s*\/\s*1/)

	const canvas = page.locator('.pdf-content canvas')
	await expect(canvas).toBeVisible()

	// The page actually rasterised: the canvas is sized from the viewport and
	// carries the fixture's blue rectangle.
	await expect.poll(
		async () => await canvas.evaluate((el: HTMLCanvasElement) =>
		{
			if (el.width < 1 || el.height < 1)
			{
				return 'unsized'
			}

			const pixels = el.getContext('2d')
				?.getImageData(0, 0, el.width, el.height)
				.data

			if (!pixels)
			{
				return 'no-context'
			}

			for (let i = 0; i < pixels.length; i += 4)
			{
				if (pixels[i] < 50 && pixels[i + 2] > 200)
				{
					return 'painted'
				}
			}

			return 'blank'
		}),
		{ message: 'canvas should contain the fixture rectangle' },
	).toBe('painted')

	// The text layer was built (TextLayer class) and scaled with the variable
	// name pdf.js v5+ actually reads.
	const textLayer = page.locator('.pdf-content .text-layer')
	await expect(textLayer).toContainText('eml test pdf')
	await expect.poll(
		async () => await textLayer.evaluate(
			el => el.style.getPropertyValue('--total-scale-factor'),
		),
		{ message: 'text layer should carry the pdf.js v5+ scale variable' },
	).not.toBe('')
})
