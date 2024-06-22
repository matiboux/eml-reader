<script lang="ts">
import { createEventDispatcher } from 'svelte'
import bytes from 'bytes'

// Props
let userClass: string | undefined = undefined
let style: string | undefined = undefined
let filename: string | undefined = undefined
let contentType: string | undefined = undefined
let data64: string | undefined = undefined
export {
	userClass as class,
	style,
	filename,
	contentType,
	data64,
}

async function downloadImage()
{
	if (!data64)
	{
		return
	}

	const a = document.createElement('a')
	a.href = `data:${contentType};base64,${data64}`
	a.download = filename ?? 'image'
	a.click()
	a.remove()
}

const dispatch = createEventDispatcher()

async function closePdfFrame()
{
	dispatch('close')
}
</script>

<div
	class={Array.from(new Set([
		'wrapper',
		...(userClass ? userClass.split(' ') : []),
	])).join(' ')}
	style={style}
>

	<div class="file-nav">
		<div class="file-nav-section">
			<p>{filename}</p>
		</div>
		<div class="file-nav-section file-nav-section-end sm-small">
			<p class="sm-hidden">
				<span class="icon icon-[mdi--database] align-icon-inline"></span>
				{data64 && bytes(data64.length)}
			</p>
			<button
				on:click|preventDefault={downloadImage}
			>
				<span class="sr-only">Download</span>
				<span class="icon icon-[mdi--download]"></span>
			</button>
			<button
				on:click|preventDefault={closePdfFrame}
			>
				<span class="icon icon-[mdi--close]"></span>
				<span class="sr-only">Close</span>
			</button>
		</div>
	</div>

	<div class="file-content">
		<div class="left">
			<span class="icon icon-[mdi--file-document]"></span>
		</div>
		<div class="right">
			<p>
				{filename}
			</p>
			<p>
				<span class="icon icon-[mdi--database] align-icon-inline"></span>
				{data64 && bytes(data64.length)}
			</p>
			<button
				on:click|preventDefault={downloadImage}
			>
				<span class="icon icon-[mdi--download]"></span>
				Download file
			</button>
		</div>
	</div>

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

	> .file-nav,
	> .file-footer {
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

		.file-nav-section {
			@apply
				col-span-3
				flex
				items-center
				justify-center
				gap-2
				;

			&.sm-small {
				@apply
					col-span-2
					;
			}

			&.sm-xsmall {
				@apply
					col-span-1
					;
			}

			&:has(.file-nav-section) {
				@apply
					gap-4
					;
			}

			&.file-nav-section-start {
				@apply
					justify-start
					;
			}

			&.file-nav-section-end {
				@apply
					justify-end
					;
			}

			> p {
				@apply
					text-center
					whitespace-nowrap
					;

				&.min-width-1 {
					@apply
						min-w-10
						;
				}

				&.min-width-2 {
					@apply
						min-w-20
						;
				}
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

			&:not(:disabled):active, &.active {
				@apply
					bg-gray-800
					;

				&:disabled {
					@apply
						bg-gray-700
						;
				}
			}
		}
	}

	@media (max-width: 899.98px)
	{
		> .file-nav {
			> .file-nav-section {
				&:has(.file-nav-section) {
					@apply
						flex-col
						gap-0
						;

					&.file-nav-section-start {
						@apply
							items-start
							justify-center
							;
					}

					&.file-nav-section-end {
						@apply
							items-end
							justify-center
							;
					}
				}
			}
		}
	}

	@media (max-width: 599.98px)
	{
		> .file-nav {
			.file-nav-section.sm-small {
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

	> .file-content {
		@apply
			relative
			bg-gray-200
			min-h-64
			grow
			flex
			items-center
			justify-center
			gap-4
			mx-auto
			overflow-y-auto
			;

		> .left {
			> .icon {
				@apply
					text-6xl
					;
			}
		}

		> .center {
			@apply
				bg-gray-500
				h-full
				w-2
				;
		}

		> .right {
			@apply
				flex
				flex-col
				items-start
				justify-center
				gap-2
				border-l-2
				border-gray-500
				pl-4
				py-2
				;

			button {
				@apply
					bg-gray-600
					min-w-10
					px-4
					py-2
					text-white
					rounded-lg
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

				&:not(:disabled):active, &.active {
					@apply
						bg-gray-800
						;

					&:disabled {
						@apply
							bg-gray-700
							;
					}
				}

				> .icon {
					@apply
						align-[-0.125em]
						;
				}
			}
		}

	}

	> .file-footer {
		@apply
			flex
			items-center
			justify-around
			items-stretch
			;
	}
}
</style>
