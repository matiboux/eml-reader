<script lang="ts">
import { unquoteString } from 'eml-parse-js'
import bytes from 'bytes'

import emlData from '~/stores/emlData'

// Props
let userClass: string | undefined = undefined
let style: string | undefined = undefined
let locale: string | undefined = undefined
export {
	userClass as class,
	style,
	locale,
}

type MenuOption = 'headers' | 'body' | 'attachments'

let menuSelected: MenuOption = 'body'

function handleMenuSelected(value: MenuOption)
{
	return (event: MouseEvent) =>
	{
		// Set the menu selected
		menuSelected = value

		// Scroll down to the menu
		const wrapper = (event.currentTarget as HTMLElement).closest<HTMLElement>('.wrapper')
		if (wrapper)
		{
			window.scrollTo({
				top: wrapper.offsetTop - 24,
				behavior: 'smooth',
			})
		}
	}
}
</script>

<div
	class={Array.from(new Set([
		'wrapper',
		...(userClass ? userClass.split(' ') : []),
		...(!$emlData ? ['hidden'] : []),
	])).join(' ')}
	style={style}
>
	{#if $emlData}

		<nav class="menu">
			<a
				class={menuSelected === 'headers' ? 'active' : ''}
				on:click={handleMenuSelected('headers')}
			>
				Headers
			</a>
			<a
				class={menuSelected === 'body' ? 'active' : ''}
				on:click={handleMenuSelected('body')}
			>
				Body
			</a>
			{#if $emlData.attachments}
				<a
					class={menuSelected === 'attachments' ? 'active' : ''}
					on:click={handleMenuSelected('attachments')}
				>
					Attachments
					<span class="badge">{$emlData.attachments.length}</span>
				</a>
			{/if}
		</nav>

		<div class="paper-main">
			<div class="paper paper-back">
			</div>

			<div class={`paper paper-front paper-${menuSelected}`}>
				{#if menuSelected === 'headers'}
					{#if $emlData.headers}
						<ul class="list-styled">
							{#each Object.entries($emlData.headers) as [key, value]}
								<li>
									<b>{key}:</b> {value}
								</li>
							{/each}
						</ul>
					{/if}

				{:else if menuSelected === 'attachments' && $emlData.attachments}
					<div class="message message-warning">
						<span class="icon icon-[mdi--warning]"></span>
						<span>Careful! Make sure you trust the source before opening or downloading attachments.</span>
					</div>

					<!-- Attachments block -->
					<ul>
						{#each $emlData.attachments as attachment}
							<li>
								<!-- <b>{attachment.name}</b> ({attachment.contentType}) -->
								<button
									class="attachment-btn"
								>
									<div class="left">
										{#if attachment.contentType.startsWith('image/')}
											<span class="icon icon-[mdi--file-image]"></span>
										{:else if attachment.contentType.startsWith('audio/')}
											<span class="icon icon-[mdi--file-music]"></span>
										{:else if attachment.contentType.startsWith('video/')}
											<span class="icon icon-[mdi--file-video]"></span>
										{:else if attachment.contentType.startsWith('application/pdf')}
											<span class="icon icon-[mdi--file-pdf-box]"></span>
										{:else}
											<span class="icon icon-[mdi--file-download]"></span>
										{/if}
									</div>
									<div class="right">
										<div><b>{unquoteString(attachment.name)}</b> ({bytes.format(attachment.data.length)})</div>
										<div> ({attachment.contentType})</div>
									</div>
								</button>
							</li>
						{/each}
					</ul>

				{:else}
					<!-- From block -->
					{#if $emlData.from}
						<div>
							<b>From:</b>
							{$emlData.from.name ? `${$emlData.from.name} <${$emlData.from.email}>` : $emlData.from.email}
						</div>
					{/if}

					<!-- To block -->
					{#if $emlData.to}
						<div>
							<b>To:</b>
							{(Array.isArray($emlData.to)
								? $emlData.to
								: [$emlData.to]
							).map(to => to.name ? `${to.name} <${to.email}>` : to.email).join(', ')}
						</div>
					{/if}

					<!-- Subject block -->
					{#if $emlData.subject}
						<div>
							<b>Subject:</b>
							{$emlData.subject}
						</div>
					{/if}

					<!-- Date block -->
					{#if $emlData.date}
						<div>
							<b>Date:</b>
							{$emlData.date.toLocaleString(locale)}
						</div>
					{/if}

					<!-- Body block -->
					{#if $emlData.html || $emlData.text}
						<div class="grow">
							<iframe
								class="w-full h-full"
								srcdoc={$emlData.html || `<pre>${$emlData.text}</pre>`}
							></iframe>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
.wrapper {
	@apply
		relative
		w-full
		flex
		flex-col
		justify-center
		gap-[calc(max(2.5rem,_5vh_/_1.294))]
		max-w-[calc(min(100%,_75vh_/_1.294))]
		;

	.menu {
		@apply
			flex
			justify-center
			space-x-4
			;

		.badge {
			@apply
				inline-block
				bg-gray-300
				min-w-[1.5rem]
				px-1
				py-0.5
				text-sm
				text-center
				text-gray-600
				rounded-full
				align-middle
				;
		}

		a {
			@apply
				bg-gray-200
				text-gray-500
				px-4
				py-2
				text-gray-600
				font-semibold
				rounded-md
				cursor-pointer
				;

			&.active {
				@apply
					bg-gray-300
					text-gray-800
					;

				.badge {
					@apply
						bg-gray-400
						text-gray-800
						;
				}
			}
		}
	}

	.message {
		@apply
			bg-gray-100
			flex
			items-center
			gap-2
			px-4
			py-2
			text-gray-600
			rounded-md
			;

		.icon {
			@apply
				flex-shrink-0
				text-xl
				;
		}

		&.message-warning {
			@apply
				bg-orange-100
				text-orange-600
				;
		}

		&.message-error {
			@apply
				bg-red-100
				text-red-600
				;
		}
	}

	.paper {
		@apply
			relative
			bg-white
			flex
			flex-col
			w-full
			mx-auto
			space-y-4
			p-6
			overflow-y-auto
			rounded-lg
			shadow-lg
			border
			border-[#00000011]
			;

		aspect-ratio: 1 / 1.294;

		&.paper-landscape {
			aspect-ratio: 1.294 / 1;
		}
	}

	.paper-main {
		@apply
			relative
			min-h-[75vh]
			;

		.paper-back {
			@apply
				absolute
				top-0
				left-0
				;
			transform: rotate(-4deg);
			margin-top: calc(-2% / 1.294);
			margin-left: -2%;
			z-index: -1;
		}

		.paper-front {
			transition: margin-top 0.5s ease;
		}

		ul.list-styled {
			@apply
				list-disc
				list-inside
				;
		}
	}

	.paper-attachments {
		ul {
			@apply
				flex
				flex-col
				items-start
				gap-4
				;

			&, > li {
				@apply
					w-full
					;
			}
		}
	}

	.attachment-btn {
		@apply
			flex
			items-center
			justify-between
			gap-2
			bg-gray-200
			w-full
			px-4
			py-2
			text-left
			text-gray-600
			rounded-md
			cursor-pointer
			;

		&:hover {
			@apply
				bg-gray-300
				text-gray-800
				;
		}

		> .left {
			@apply
				flex-shrink-0
				text-2xl
				;
		}

		> .right {
			@apply
				flex-grow
				flex
				flex-col
				items-start
				;
		}
	}
}

@import "~/styles/style.scss";

span[class^="icon-"], span[class*=" icon-"] {
	@extend .align-icon-inline;
}
</style>
