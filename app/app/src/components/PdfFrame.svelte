<script lang="ts">
import { onMount } from 'svelte'
import bytes from 'bytes'

// Props
let userClass: string | undefined = undefined
let style: string | undefined = undefined
let data64: string | undefined = undefined
export {
	userClass as class,
	style,
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

function handlePage(page: any)
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
	Promise.all([
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
	PdfJS.getDocument({ data: data }).promise.then((pdf: any) =>
		{
			pdfDocument = pdf

			// Fetch the current page
			pdf.getPage(currPage).then(handlePage)
		})
}

onMount(async () =>
	{
		if (!data64)
		{
			return
		}

		loadPdf(atob(data64))
	})
</script>

<div
	class={Array.from(new Set([
		'wrapper',
		...(userClass ? userClass.split(' ') : []),
	])).join(' ')}
	style={style}
>

	<div class="pdf-nav">
		<div class="pdf-nav-section">
		</div>
		<div class="pdf-nav-section">
		</div>
		<div class="pdf-nav-section">
			<p>
				{currPage} / {pdfDocument?.numPages ?? '...'}
			</p>
			<div class="buttons-group">
				<button disabled>
					<span class="icon icon-[mdi--chevron-left]"></span>
					<span class="sr-only">Previous</span>
				</button>
				<button disabled>
					<span class="sr-only">Next</span>
					<span class="icon icon-[mdi--chevron-right]"></span>
				</button>
			</div>
		</div>
		<div class="pdf-nav-section">
			<p>
				<span class="sr-only">Zoom</span>
				100%
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
		<div class="pdf-nav-section">
			<p>
				<span class="icon icon-[mdi--database] align-icon-inline"></span>
				{data64 && bytes(data64.length)}
			</p>
			<button disabled>
				<span class="sr-only">Download</span>
				<span class="icon icon-[mdi--download]"></span>
			</button>
		</div>
		<div class="pdf-nav-section">
			<button disabled>
				<span class="icon icon-[mdi--close]"></span>
				<span class="sr-only">Close</span>
			</button>
		</div>
	</div>

	<div
		class="pdf-content"
		bind:this={contentWrapper}
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

		> .pdf-nav-section {
			@apply
				flex
				items-center
				justify-center
				gap-2
				;

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
