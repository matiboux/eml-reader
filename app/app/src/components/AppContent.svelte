<script lang="ts">
import { unquoteString } from 'eml-parse-js'
import bytes from 'bytes'

import openedAttachmentIndex from '~/stores/openedAttachmentIndex'
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

function handleMenuSelect(value: MenuOption)
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

function handleAttachmentSelect(value: number)
{
	return () =>
	{
		openedAttachmentIndex.set(value)
	}
}

function getAttachmentName(attachment: any): string
{
    var match = /(?:N|n)ame=(?:'|")?(.+?)(?:'|")?(\s*;[\s\S]*)?$/g.exec(attachment.contentType)
	return unquoteString(match ? match[1] : attachment.name)
}

function getDataHtml(emlData: Record<string, any>): string
{
	if (!emlData.html)
	{
		return `<pre>${emlData.text}</pre>`
	}

	let html = emlData.html

	// Add base target to the HTML
	html = html.replace(/<head>/, '<head><base target="_parent">')

	const cidRegex = /\ssrc="cid:([^"]+)"/g
	let match: RegExpExecArray | null
	while ((match = cidRegex.exec(html)))
	{
		const cid = match[1]
		const attachment = emlData.attachments.find((attachment: any) => attachment.id === `<${cid}>`)
		if (attachment)
		{
			const contentType = attachment.contentType.split(';')[0]
			html = html.replace(new RegExp(`\\ssrc="cid:${cid}"`, 'g'), ` src="data:${contentType};base64,${attachment.data64}"`)
		}
	}

	return html
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
				on:click={handleMenuSelect('headers')}
			>
				Headers
			</a>
			<a
				class={menuSelected === 'body' ? 'active' : ''}
				on:click={handleMenuSelect('body')}
			>
				Body
			</a>
			{#if $emlData.attachments}
				<a
					class={menuSelected === 'attachments' ? 'active' : ''}
					on:click={handleMenuSelect('attachments')}
				>
					Attachments
					<span class="badge">{$emlData.attachments.length}</span>
				</a>
			{/if}
		</nav>

		<div class="paper-main">
			<div class="paper paper-back">
			</div>

			{#if $emlData.attachments}
				<div class="paper paper-back paper-back-alt">
				</div>
			{/if}

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
						{#each $emlData.attachments as attachment, index}
							<li>
								<!-- <b>{attachment.name}</b> ({attachment.contentType}) -->
								<button
									class="attachment-btn"
									on:click={handleAttachmentSelect(index)}
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
										<div><b>{getAttachmentName(attachment)}</b> ({bytes.format(attachment.data.length)})</div>
									</div>
								</button>
							</li>
						{/each}
					</ul>

				{:else}
					<div class="email-header">
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

						{#if $emlData.attachments}
							<div>
								<p>
									<span class="icon icon-[mdi--paperclip] align-icon-inline"></span>
									{$emlData.attachments.length} attachment{#if $emlData.attachments.length > 1}s{/if}
									–
									<button
										class="text-blue-600 underline"
										on:click={handleMenuSelect('attachments')}
									>
										See attachments
									</button>
								</p>
							</div>
						{/if}
					</div>

					<!-- Body block -->
					{#if $emlData.html || $emlData.text}
						<div class="email-frame">
							<iframe
								class="w-full h-full"
								srcdoc={getDataHtml($emlData)}
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
		gap-4
		max-w-[calc(min(750px,_100%,_75vh_/_1.294))]
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
			gap-4
			w-full
			mx-auto
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
			my-[calc(max(1rem,_2.5vh))]
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

			&.paper-back-alt {
				transform: rotate(4deg);
				margin-top: calc(-2% / 1.294);
				margin-left: 2%;
			}
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

	.paper-body {
		@apply
			p-0
			;

		.email-header {
			@apply
				relative
				flex
				flex-col
				items-start
				gap-2
				px-6
				pt-6
				;

			> div {
				@apply
					flex
					items-start
					gap-2
					;

				+ div::before {
					@apply
						content-['']
						absolute
						w-[calc(100%_-_2rem)]
						-mt-1
						-ml-2
						border-t
						border-gray-200
						;
				}
			}
		}

		.email-frame {
			@apply
				grow
				border-t
				border-gray-200
				;

			iframe {
				@apply
					w-full
					h-full
					;
			}
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
