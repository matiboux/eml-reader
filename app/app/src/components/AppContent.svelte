<script lang="ts">
import { unquoteString } from 'eml-parse-js'
import bytes from 'bytes'

import type { Locales } from '~/i18n/type.d.ts'
import { i18nFactory } from '~/i18n'
import openedAttachmentIndex from '~/stores/openedAttachmentIndex'
import emlData from '~/stores/emlData'

// Props
let userClass: string | undefined = undefined
let style: string | undefined = undefined
let locale: Locales | undefined = undefined
export {
	userClass as class,
	style,
	locale,
}

const _ = i18nFactory(locale)

type MenuOption = 'headers' | 'body' | 'attachments'

let menuSelected: MenuOption = 'body'
let showHtml: boolean = true

emlData.subscribe(data =>
{
	if (!data)
	{
		return
	}

	if (!data.html)
	{
		showHtml = false
	}
	else if (!data.text)
	{
		showHtml = true
	}
})

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

function getPlainText(emlData: Record<string, any>): string
{
	return `<pre>${emlData.text}</pre>`
}

function getHtml(emlData: Record<string, any>): string
{
	if (!emlData.html)
	{
		return getPlainText(emlData)
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
				{_({
					en: 'Headers',
					fr: 'En-têtes',
				})}
			</a>
			<a
				class={menuSelected === 'body' ? 'active' : ''}
				on:click={handleMenuSelect('body')}
			>
				{_({
					en: 'Body',
					fr: 'Corps',
				})}
			</a>
			{#if $emlData.attachments}
				<a
					class={menuSelected === 'attachments' ? 'active' : ''}
					on:click={handleMenuSelect('attachments')}
				>
					{_({
						en: 'Attachments',
						fr: 'Pièces jointes',
					})}
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
						<span>
							{_({
								en: 'Careful! Make sure you trust the source before opening or downloading attachments.',
								fr: 'Attention ! Assurez-vous de faire confiance en la source avant d\'ouvrir ou de télécharger les pièces jointes.',
							})}
						</span>
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
						<div class="left">
							<!-- From block -->
							{#if $emlData.from}
								<div>
									<div class="email-header-key">
										{_({
											en: 'From:',
											fr: 'De :',
										})}
									</div>
									<div>
										{$emlData.from.name ? `${$emlData.from.name} <${$emlData.from.email}>` : $emlData.from.email}
									</div>
								</div>
							{/if}

							<!-- To block -->
							{#if $emlData.to}
								<div>
									<div class="email-header-key">
										{_({
											en: 'To:',
											fr: 'À :',
										})}
									</div>
									<div>
										{@html
											(Array.isArray($emlData.to)
												? $emlData.to
												: [$emlData.to]
											)
												.map(to =>
													(text =>
													{
														const p = document.createElement('p')
														p.textContent = text
														const escapedHtml = p.innerHTML
														p.remove()
														return escapedHtml
													})
													(to.name ? `${to.name} <${to.email}>` : to.email)
												)
												.join(` <span>;</span> `)
										}
									</div>
								</div>
							{/if}

							<!-- Subject block -->
							{#if $emlData.subject}
								<div>
									<div class="email-header-key">
										{_({
											en: 'Subject:',
											fr: 'Sujet :',
										})}
									</div>
									<div>
										{$emlData.subject}
									</div>
								</div>
							{/if}

							<!-- Date block -->
							{#if $emlData.date}
								<div>
									<div class="email-header-key">
										{_({
											en: 'Date:',
											fr: 'Date :',
										})}
									</div>
									<div>
										{$emlData.date.toLocaleString(locale)}
									</div>
								</div>
							{/if}

							{#if $emlData.attachments}
								<div>
									<div>
										<span class="icon icon-[mdi--paperclip] align-icon-inline"></span>
										{$emlData.attachments.length}
										{_({
											en: $emlData.attachments.length > 1 ? 'attachments' : 'attachment',
											fr: $emlData.attachments.length > 1 ? 'pièces jointes' : 'pièce jointe',
										})}
										–
										<button
											class="text-blue-600 underline"
											on:click={handleMenuSelect('attachments')}
										>
											{_({
												en: 'See attachments',
												fr: 'Voir les pièces jointes',
											})}
										</button>
									</div>
								</div>
							{/if}
						</div>
						{#if $emlData.html && $emlData.text}
							<div class="right">
								<label class="html-toggle">
									<input
										type="checkbox"
										bind:checked={showHtml}
									/>
									{#if showHtml}
										<span class="icon icon-[mdi--toggle-switch]"></span>
										<span>
											HTML
										</span>
									{:else}
										<span class="icon icon-[mdi--toggle-switch-off-outline]"></span>
										<span>
											{_({
												en: 'Plain text',
												fr: 'Texte brut',
											})}
										</span>
									{/if}
								</label>
							</div>
						{/if}
					</div>

					<!-- Body block -->
					{#if $emlData.html || $emlData.text}
						<div class="email-frame">
							<iframe
								class="w-full h-full"
								srcdoc={showHtml ? getHtml($emlData) : getPlainText($emlData)}
							></iframe>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
@reference "tailwindcss/theme";

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
				flex
				items-start
				gap-4
				px-6
				pt-6
				;

			> .left {
				@apply
					grow
					relative
					flex
					flex-col
					items-start
					gap-2
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
							w-[calc(100%)]
							-mt-1
							-ml-2
							border-t
							border-gray-200
							;
					}

					> .email-header-key {
						@apply
							font-bold
							flex-shrink-0
							;
					}

					> div > :global(span) {
						@apply
							text-gray-400
							;
					}
				}
			}

			> .right {
				@apply
					relative
					flex
					flex-col
					items-start
					gap-2
					;

				.html-toggle {
					@apply
						bg-gray-200
						relative
						flex
						flex-col
						items-center
						px-2
						py-1
						whitespace-nowrap
						rounded-lg
						border
						border-[#00000011]
						cursor-pointer
						;

					&:hover {
						@apply
							bg-gray-300
							;
					}

					> input[type="checkbox"] {
						@apply
							hidden
							;
					}

					> span {
						@apply
							text-xs
							;
					}

					> .icon {
						@apply
							text-gray-600
							text-xl
							;
					}

					@media (min-width: 600px) {
						> span {
							@apply
								text-sm
								;
						}

						> .icon {
							@apply
								text-2xl
								;
						}
					}

					> input[type="checkbox"]:checked ~ .icon {
						@apply
							text-blue-600
							;
					}
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
