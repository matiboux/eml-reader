<script lang="ts">
import { i18nFactory } from '~/i18n'
import type { Locales } from '~/i18n/type.d.ts'
import emlData from '~/stores/emlData'

export let locale: Locales | undefined = undefined
/** Also show Message-ID and Delivered-To */
export let extended: boolean = false
/** Show these raw headers instead of the e-mail fields */
export let rows: [string, string][] | undefined = undefined

/** Header names shown by the extended fields */
const EXTENDED_HEADERS = ['Message-ID', 'Delivered-To']

/** Whether a raw header value goes below its key rather than beside it */
function shouldWrap(key: string, value: string): boolean
{
	return value.length >= 96 || (key.length >= 16 && value.length >= 64)
}

function findHeader(name: string): string | undefined
{
	const entry = Object.entries<string>($emlData?.headers ?? {})
		.find(([key]) => key.toLowerCase() === name.toLowerCase())
	return entry?.[1]
}

const _ = i18nFactory(locale)

// French puts a space before the colon
const colon = _({
	en: ':',
	fr: ' :',
})
</script>

{#if $emlData}
<div class="fields" class:stacked={!!rows}>
{#if rows}
	{#each rows as [key, value]}
		<div class:wrapped={shouldWrap(key, value)}>
			<div class="email-header-key">{key}{colon}</div>
			<div class="email-header-value">{value}</div>
		</div>
	{/each}
{:else}
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

	{#if extended}
		{#each EXTENDED_HEADERS as name}
			{@const value = findHeader(name)}
			{#if value}
				<div>
					<div class="email-header-key">{name}{colon}</div>
					<div class="email-header-value">{value}</div>
				</div>
			{/if}
		{/each}
	{/if}

	<slot />
{/if}
</div>
{/if}

<style lang="scss">
@reference "tailwindcss/theme";

// Raw headers: long values drop below their key
.fields.stacked > :global(div.wrapped) {
	@apply
		flex-col
		gap-0
		;

	> :global(.email-header-value) {
		@apply
			pl-4
			;
	}
}

.fields {
	@apply
		grow
		relative
		flex
		flex-col
		items-start
		gap-2
		;

	> :global(div) {
		@apply
			flex
			items-start
			gap-2
			;

		+ :global(div)::before {
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

		> :global(.email-header-key) {
			@apply
				font-bold
				flex-shrink-0
				;
		}

		> :global(.email-header-value) {
			@apply
				min-w-0
				;
			overflow-wrap: anywhere;
		}

		> :global(div > span) {
			@apply
				text-gray-400
				;
		}
	}
}
</style>
