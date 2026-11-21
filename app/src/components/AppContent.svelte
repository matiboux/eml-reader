<script lang="ts">
import { unquoteString } from '~/lib/parseEml'
import bytes from 'bytes'

import type { Locales } from '~/i18n/type.d.ts'
import { i18nFactory } from '~/i18n'
import openedAttachmentIndex from '~/stores/openedAttachmentIndex'
import emlData from '~/stores/emlData'
import EmailFields from './EmailFields.svelte'

// Props
let userClass: string | undefined = undefined
let style: string | undefined = undefined
let locale: Locales | undefined = undefined
let title: string | undefined = undefined
export {
	userClass as class,
	style,
	locale,
	title,
}

const _ = i18nFactory(locale)

type MenuOption = 'headers' | 'body' | 'attachments'

let menuSelected: MenuOption = 'body'
let showHtml: boolean = true
// Remote content (images, stylesheets, fonts) is blocked until the user allows it
let allowRemote: boolean = false

emlData.subscribe(data =>
{
	allowRemote = false

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

// Headers already shown as e-mail fields
const FIELD_HEADERS = ['from', 'to', 'subject', 'date', 'message-id', 'delivered-to']
$: otherHeaders = Object.entries<string>($emlData?.headers ?? {})
	.filter(([key]) => !FIELD_HEADERS.includes(key.toLowerCase()))

function handleBack(event: MouseEvent)
{
	event.preventDefault()
	openedAttachmentIndex.set(null)
	emlData.set(null)
	menuSelected = 'body'
	window.scrollTo({ top: 0, behavior: 'smooth' })
}

function handleMenuSelect(value: MenuOption)
{
	return () =>
	{
		menuSelected = value
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
	// Escape the text: it must be displayed as is, never parsed as markup
	const text = String(emlData.text ?? '')
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
	return `<pre>${text}</pre>`
}

// Detects markup that would reach the network when rendered
const REMOTE_PATTERN = /(?:src|background|href)\s*=\s*["']?\s*(?:https?:)?\/\/|url\(\s*["']?\s*(?:https?:)?\/\//i

function hasRemoteContent(emlData: Record<string, any>): boolean
{
	return Boolean(emlData.html) && REMOTE_PATTERN.test(emlData.html)
}

// Content-Security-Policy for the e-mail body: network content is blocked unless allowed
function getCspMeta(allowRemote: boolean): string
{
	const net = allowRemote ? ' http: https:' : ''
	const csp = `default-src 'none'; style-src 'unsafe-inline'${net}; img-src data:${net}; font-src data:${net}`
	return `<meta http-equiv="Content-Security-Policy" content="${csp}">`
}

function getHtml(emlData: Record<string, any>, allowRemote: boolean): string
{
	if (!emlData.html)
	{
		return getPlainText(emlData)
	}

	let html = emlData.html

	// Add the content security policy and the base target to the HTML
	const head = `${getCspMeta(allowRemote)}<base target="_blank">`
	if (/<head[^>]*>/i.test(html))
	{
		html = html.replace(/<head([^>]*)>/i, `<head$1>${head}`)
	}
	else if (/<html[^>]*>/i.test(html))
	{
		html = html.replace(/<html([^>]*)>/i, `<html$1><head>${head}</head>`)
	}
	else
	{
		html = `<!doctype html><html><head>${head}</head><body>${html}</body></html>`
	}

	// Inline `cid:` images as data: URIs. Guard on `attachments`: an e-mail can
	// reference a cid without an attachments array, and `.find` on `undefined`
	// would throw and blank the whole body.
	if (Array.isArray(emlData.attachments))
	{
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

		<div class="menu-bar">
			<a
				href="./"
				class="back"
				on:click={handleBack}
			>
				<h2>
					<span class="icon icon-[mdi--chevron-left] align-icon-inline"></span>
					{title}
				</h2>
			</a>
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
		</div>

		<div class="paper-column">
			<div class="paper-main">
				<div class="paper paper-back">
				</div>

				{#if $emlData.attachments}
					<div class="paper paper-back paper-back-alt">
					</div>
				{/if}

				<div class="paper paper-front">
					<div class={`paper-content paper-${menuSelected}`}>
						{#if menuSelected === 'headers'}
							<div class="email-header">
								<EmailFields {locale} extended />
							</div>

							{#if otherHeaders.length > 0}
								<div class="email-header email-header-other">
									<EmailFields {locale} rows={otherHeaders} />
								</div>
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
												<div><b>{getAttachmentName(attachment)}</b> ({bytes.format(attachment.size)})</div>
											</div>
										</button>
									</li>
								{/each}
							</ul>

						{:else}
							<div class="email-header">
								<EmailFields {locale}>
									{#if $emlData.attachments}
										<div>
											<div>
												<span class="icon icon-[mdi--paperclip] align-icon-inline text-gray-600!"></span>
												{$emlData.attachments.length}
												{_({
													en: $emlData.attachments.length > 1 ? 'attachments' : 'attachment',
													fr: $emlData.attachments.length > 1 ? 'pièces jointes' : 'pièce jointe',
												})}
												–
												<a
													href="#attachments"
													class="text-blue-600 underline hover:text-blue-800"
													on:click|preventDefault={handleMenuSelect('attachments')}
												>
													{_({
														en: 'See attachments',
														fr: 'Voir les pièces jointes',
													})}
												</a>
											</div>
										</div>
									{/if}
								</EmailFields>
								{#if ($emlData.html && $emlData.text) || $emlData.attachments}
									<div class="right">
										{#if $emlData.html && $emlData.text}
											<label class="html-toggle">
												<input
													type="checkbox"
													bind:checked={showHtml}
												/>
												<span class={`icon ${showHtml ? 'icon-[mdi--toggle-switch]' : 'icon-[mdi--toggle-switch-off-outline]'}`}></span>
												<span>
													HTML
												</span>
											</label>
										{/if}
										{#if $emlData.attachments}
											<a
												href="#attachments"
												class="html-toggle"
												on:click|preventDefault={handleMenuSelect('attachments')}
											>
												<span class="icon icon-[mdi--attachment]"></span>
												<span class="sr-only">
													{_({
														en: 'Attachments',
														fr: 'Pièces jointes',
													})}
												</span>
												<span aria-hidden="true">
													{$emlData.attachments.length}
												</span>
											</a>
										{/if}
									</div>
								{/if}
							</div>

							<!-- Body block -->
							{#if $emlData.html || $emlData.text}
								<div class="email-frame">
									{#if showHtml && !allowRemote && hasRemoteContent($emlData)}
										<div class="remote-notice">
											<span>
												{_({
													en: 'Remote images and content are blocked.',
													fr: 'Les images et contenus distants sont bloqués.',
												})}
											</span>
											<button
												type="button"
												on:click={() => { allowRemote = true }}
											>
												{_({
													en: 'Load remote content',
													fr: 'Charger le contenu distant',
												})}
											</button>
										</div>
									{/if}
									<!-- Security: Sandboxed iframe. Links may only open in a new tab, and the
									opened page is not sandboxed. Never add allow-scripts or allow-same-origin:
									e-mail bodies are untrusted input. -->
									<iframe
										class="w-full h-full"
										sandbox="allow-popups allow-popups-to-escape-sandbox"
										referrerpolicy="no-referrer"
										title={_({ en: 'E-mail body', fr: 'Corps de l\'e-mail' })}
										srcdoc={showHtml ? getHtml($emlData, allowRemote) : getPlainText($emlData)}
									></iframe>
								</div>
							{/if}
						{/if}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="scss">
@use "~/styles/style.scss";
@reference "tailwindcss/theme";

.wrapper {
	@apply
		relative
		w-full
		flex
		flex-col
		justify-center
		gap-4
		;

	.paper-column {
		@apply
			w-full
			mx-auto
			max-w-[calc(min(750px,_100%,_max(75vh_/_1.294,_480px)))]
			;
	}

	.menu-bar {
		@apply
			flex
			flex-wrap
			items-center
			justify-start
			gap-x-8
			gap-y-2
			;

		.back {
			@apply
				text-gray-600
				hover:text-gray-900
				;

			h2 {
				@apply
					text-xl
					font-bold
					;
			}
		}
	}

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
				bg-transparent
				items-start
				text-orange-600
				;

			// Same icon size as the attachment buttons below, so icons and texts line up
			.icon {
				@apply
					text-2xl
					;
			}
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
			overflow-hidden
			rounded-lg
			shadow-lg
			border
			border-[#00000011]
			;

		// Minimum inset, so content never touches the paper borders:
		// the content wrapper scrolls inside it, so overflow is hidden there
		--paper-inset: 1px;
		padding: var(--paper-inset);

		aspect-ratio: 1 / 1.294;

		&.paper-landscape {
			aspect-ratio: 1.294 / 1;
		}
	}

	.paper-content {
		@apply
			flex
			flex-col
			gap-4
			grow
			min-h-0
			overflow-y-auto
			;
		padding: calc(1.5rem - var(--paper-inset));
	}

	.paper-main {
		@apply
			relative
			my-[calc(max(1.3rem,_2.5vh))]
			;

		.paper-back {
			@apply
				absolute
				bg-gray-50
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
			@apply
				shadow-xl
				;
			transition: margin-top 0.5s ease;
		}

		ul.list-styled {
			@apply
				list-disc
				list-inside
				;
		}
	}

	.paper-headers {
		@apply
			gap-0
			;

		.email-header {
			padding-bottom: calc(1rem - var(--paper-inset));
		}
	}

	.paper-body,
	.paper-headers {
		padding: 0;

		.email-header {
			@apply
				flex
				items-start
				gap-4
				;
			padding-inline: calc(1.5rem - var(--paper-inset));
			padding-top: calc(1rem - var(--paper-inset));

			> .right {
				@apply
					relative
					flex
					flex-col
					items-stretch
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

		.email-header-other {
			@apply
				border-t
				border-gray-200
				;
			padding-top: calc(1rem - var(--paper-inset));
			padding-bottom: calc(1.5rem - var(--paper-inset));
		}

		.email-frame {
			@apply
				grow
				flex
				flex-col
				min-h-0
				border-t
				border-gray-200
				;

			.remote-notice {
				@apply
					flex
					flex-wrap
					items-center
					justify-between
					gap-2
					px-3
					py-2
					text-sm
					bg-yellow-50
					text-gray-800
					border-b
					border-gray-200
					;

				button {
					@apply
						cursor-pointer
						underline
						;
				}
			}

			iframe {
				@apply
					w-full
					flex-1
					min-h-0
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
			min-width: 0;
			overflow-wrap: anywhere;
		}
	}
}

span[class^="icon-"], span[class*=" icon-"] {
	@extend .align-icon-inline;
}
</style>
