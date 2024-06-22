<script lang="ts">
import { onMount, onDestroy, createEventDispatcher } from 'svelte'
import bytes from 'bytes'

// Props
let userClass: string | undefined = undefined
let style: string | undefined = undefined
let filename: string | undefined = undefined
let data64: string | undefined = undefined
export {
	userClass as class,
	style,
	filename,
	data64,
}

let scale: number | null = null
let currPage = 1
let contentWrapper: HTMLDivElement
let pdfCanvas: HTMLCanvasElement
let textLayer: HTMLDivElement

let pdfDocument: any = null

function getInitialScale(page: any)
{
	// Get the standard scale page dimensions
	const { width, height } = page.getViewport({ scale: 1 })

	return Math.min(
		contentWrapper.offsetWidth / width,
		contentWrapper.offsetHeight / height,
	)
}

async function handlePage(page: any)
{
	if (scale === null)
	{
		scale = getInitialScale(page)
	}

	var viewport = page.getViewport({ scale: scale })

	// Prepare canvas using PDF page dimensions
	var context = pdfCanvas.getContext('2d')
	pdfCanvas.height = viewport.height
	pdfCanvas.width = viewport.width

	// Render PDF page into canvas context
	var renderContext = {
		canvasContext: context,
		viewport: viewport
	}
	var renderTask = page.render(renderContext)

	var textPromise = page.getTextContent()

	await Promise.all([
		renderTask.promise,
		textPromise,
	]).then(async ([_, textContent]) =>
		{
			// Prepare text layer
			textLayer.innerHTML = ''

			// Set --scale-factor to the PDF scale
			textLayer.style.setProperty('--scale-factor', scale!.toString())

			const PdfJS = await import('pdfjs-dist')
			PdfJS.renderTextLayer({
				textContentSource: textContent,
				container: textLayer,
				viewport: viewport,
				textDivs: [],
			})
		})
}

async function loadPdf(data: string)
{
	const PdfJS = await import('pdfjs-dist')
	const PdfJSWorker = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
	PdfJS.GlobalWorkerOptions.workerSrc = PdfJSWorker
	await PdfJS.getDocument({ data: data }).promise.then((pdf: any) =>
		{
			pdfDocument = pdf
		})
}

let resizeHandlerTimeout: NodeJS.Timeout | null = null
let resizeHandleMutex: boolean = false

function onPdfContentResize(_: ResizeObserverEntry[], __: ResizeObserver)
{
	if (resizeHandleMutex)
	{
		return
	}

	if (resizeHandlerTimeout !== null)
	{
		clearTimeout(resizeHandlerTimeout)
	}

	resizeHandlerTimeout = setTimeout(() =>
		{
			if (!pdfDocument)
			{
				return
			}

			resizeHandleMutex = true

			// Fetch the current page
			pdfDocument.getPage(currPage).then(
				async (page: any) =>
				{
					// Reset the scale
					scale = getInitialScale(page)

					// Re-render the page
					await handlePage(page)

					resizeHandleMutex = false
				},
			)
		}, 50)
}

onMount(async () =>
	{
		if (!data64)
		{
			return
		}

		await loadPdf(atob(data64))
		new ResizeObserver(onPdfContentResize).observe(contentWrapper)
	})

onDestroy(async () =>
	{
		pdfDocument = null
	})

function onPdfContentMouseWheel(event: WheelEvent)
{
	if (!pdfDocument)
	{
		return
	}

	// event.preventDefault()
	console.log('mousewheel', event)
}

async function loadPreviousPage()
{
	// Previous page
	currPage = Math.max(currPage - 1, 1)
	await pdfDocument?.getPage(currPage).then(handlePage)
}

async function loadNextPage()
{
	// Next page
	currPage = Math.min(currPage + 1, pdfDocument.numPages)
	await pdfDocument?.getPage(currPage).then(handlePage)
}

async function onPdfContentKeyUp(event: KeyboardEvent)
{
	if (!pdfDocument)
	{
		return
	}

	switch(event.key)
	{
		case 'ArrowUp':
		case 'ArrowLeft':
		{
			// Previous page
			event.preventDefault()
			await loadPreviousPage()
			break
		}
		case 'ArrowDown':
		case 'ArrowRight':
		{
			// Next page
			event.preventDefault()
			await loadNextPage()
			break
		}
	}
}

async function downloadPdf()
{
	if (!data64)
	{
		return
	}

	const a = document.createElement('a')
	a.href = `data:application/pdf;base64,${data64}`
	a.download = filename ?? 'document.pdf'
	a.click()
	a.remove()
}

const dispatch = createEventDispatcher()

async function closePdfFrame()
{
	dispatch('close')
}
</script>

<svelte:document
	on:keyup={onPdfContentKeyUp}
/>

<div
	class={Array.from(new Set([
		'wrapper',
		...(userClass ? userClass.split(' ') : []),
	])).join(' ')}
	style={style}
>

	<div class="pdf-nav">
		<div class="pdf-nav-section">
			<p>{filename}</p>
		</div>
		<div class="pdf-nav-section">
			<div class="pdf-nav-section">
				<p>
					<span class="sr-only">Page</span>
					{currPage} / {pdfDocument?.numPages ?? '...'}
				</p>
				<div class="buttons-group">
					<button
						on:click|preventDefault={loadPreviousPage}
					>
						<span class="icon icon-[mdi--chevron-left]"></span>
						<span class="sr-only">Previous</span>
					</button>
					<button
						on:click|preventDefault={loadNextPage}
					>
						<span class="sr-only">Next</span>
						<span class="icon icon-[mdi--chevron-right]"></span>
					</button>
				</div>
			</div>
			<div class="pdf-nav-section">
				<p>
					<span class="sr-only">Zoom</span>
					{scale ? `${Math.round(scale * 100)}%` : '...'}
				</p>
				<div class="buttons-group">
					<button disabled>
						<span class="sr-only">Zoom Out</span>
						<span class="icon icon-[mdi--magnify-minus]"></span>
					</button>
					<button disabled>
						<span class="sr-only">Zoom In</span>
						<span class="icon icon-[mdi--magnify-plus]"></span>
					</button>
				</div>
			</div>
		</div>
		<div class="pdf-nav-section pdf-nav-section-end sm-small">
			<div class="pdf-nav-section">
				<p class="sm-hidden">
					<span class="icon icon-[mdi--database] align-icon-inline"></span>
					{data64 && bytes(data64.length)}
				</p>
				<button
					on:click|preventDefault={downloadPdf}
				>
					<span class="sr-only">Download</span>
					<span class="icon icon-[mdi--download]"></span>
				</button>
			</div>
			<div class="pdf-nav-section">
				<button
					on:click|preventDefault={closePdfFrame}
				>
					<span class="icon icon-[mdi--close]"></span>
					<span class="sr-only">Close</span>
				</button>
			</div>
		</div>
	</div>

	<div
		class="pdf-content"
		bind:this={contentWrapper}
		on:mousewheel={onPdfContentMouseWheel}
	>
		<canvas
			bind:this={pdfCanvas}
		></canvas>
		<div
			class="text-layer"
			bind:this={textLayer}
		></div>
	</div>

	<!-- <div class="pdf-footer">
		<div class="pdf-nav-section">
		</div>
		<div class="pdf-nav-section">
		</div>
	</div> -->

</div>

<style lang="scss">
.wrapper
{
	@apply
		flex
		flex-col
		items-center
		w-full
		h-full
		overflow-hidden
		;

	> * {
		@apply
			w-full
			shrink-0
			;
	}

	> .pdf-nav,
	> .pdf-footer {
		@apply
			bg-gray-600
			grid
			grid-flow-col
			auto-cols-fr
			gap-4
			h-10
			px-4
			text-white
			;

		.pdf-nav-section {
			@apply
				col-span-2
				flex
				items-center
				justify-center
				gap-2
				;

			&:has(.pdf-nav-section) {
				@apply
					gap-4
					;
			}

			&.pdf-nav-section-start {
				@apply
					justify-start
					;
			}

			&.pdf-nav-section-end {
				@apply
					justify-end
					;
			}

			> p {
				@apply
					min-w-20
					text-center
					whitespace-nowrap
					;
			}
		}

		.buttons-group {
			@apply
				flex
				items-center
				justify-center
				;
		}

		button {
			@apply
				flex
				items-center
				justify-center
				min-w-10
				h-10
				;

			&:disabled {
				@apply
					cursor-not-allowed
					opacity-50
					;
			}

			&:not(:disabled):hover {
				@apply
					bg-gray-700
					;
			}

			&:not(:disabled):active {
				@apply
					bg-gray-800
					;
			}
		}
	}

	@media (max-width: 799.98px)
	{
		> .pdf-nav {
			@apply
				h-16
				;

			> .pdf-nav-section {
				&:has(.pdf-nav-section) {
					@apply
						flex-col
						gap-0
						;

					&.pdf-nav-section-start {
						@apply
							items-start
							justify-center
							;
					}

					&.pdf-nav-section-end {
						@apply
							items-end
							justify-center
							;
					}
				}

				> p {
					@apply
						min-w-16
						;
				}
			}

			button {
				@apply
					min-h-8
					h-8
					;
			}
		}
	}

	@media (max-width: 549.98px)
	{
		> .pdf-nav {
			.pdf-nav-section.sm-small {
				@apply
					col-span-1
					;
			}

			.sm-hidden {
				@apply
					hidden
					;
			}
		}
	}

	> .pdf-content {
		@apply
			relative
			bg-gray-400
			grow
			flex
			items-center
			justify-center
			mx-auto
			overflow-y-auto
			;

		> .text-layer {
			@apply
				text-transparent
				;
				// invisible

			&, > :global(*) {
				@apply
					absolute
					;
			}

			> :global(br) {
				@apply
					hidden
					;
			}
		}
	}

	> .pdf-footer {
		@apply
			flex
			items-center
			justify-around
			items-stretch
			;
	}
}
</style>
