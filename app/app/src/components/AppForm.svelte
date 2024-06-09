<script lang="ts">
import { readEml } from 'eml-parse-js'

// Props
let userClass: string | undefined = undefined
let style: string | undefined = undefined
let locale: string | undefined = undefined
export {
	userClass as class,
	style,
	locale,
}

import { i18nFactory } from '~/i18n'
const _ = i18nFactory(locale as any)

let emlError: any = null
let emlData: any = null

async function onChange(event: Event)
{
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (!file)
	{
		return
	}

	const reader = new FileReader()
	reader.onload = async () =>
	{
		const content = reader.result as string

		readEml(
			content,
			(error, data) =>
			{
				if (error)
				{
					emlError = error
					emlData = null
					return
				}

				if (
					Object.keys(data.headers).length <= 0 ||
					(
						!data.headers.hasOwnProperty('Content-Type') &&
						data.headers.hasOwnProperty('')
					)
				)
				{
					emlError = 'Invalid EML file'
					emlData = null
					return
				}

				emlError = null
				emlData = data
				console.log(error, data)
			}
		)
	}
	reader.readAsText(file)
}
</script>

<div
	class={Array.from(new Set([
		...(userClass ? userClass.split(' ') : []),
		'flex flex-col space-y-4',
	])).join(' ')}
	style={style}
>

	<!-- Two columns for input & output -->
	<div class="grid grid-cols-2 gap-4">
		<!-- Input type -->
		<div class="space-y-4 col-span-2 sm:col-auto">
			<div class="block space-y-2">
				<span class="text-gray-700">
					{_({
						'en': 'File',
						'fr': 'Fichier',
					})}
				</span>
				<input
					type="file"
					class="form-input"
					on:change={onChange}
				/>
			</div>
		</div>
	</div>

	{#if emlError}
		<hr />

		<!-- From block -->
		<div>
			<b>Error:</b>
			{emlError}
		</div>
	{/if}

	{#if emlData}
		<hr />

		<!-- From block -->
		{#if emlData.from}
			<div>
				<b>From:</b>
				{emlData.from.name ? `${emlData.from.name} <${emlData.from.email}>` : emlData.from.email}
			</div>

			<hr />
		{/if}

		<!-- To block -->
		{#if emlData.to}
			<div>
				<b>To:</b>
				{emlData.to.name ? `${emlData.to.name} <${emlData.to.email}>` : emlData.to.email}
			</div>

			<hr />
		{/if}

		<!-- Subject block -->
		{#if emlData.subject}
			<div>
				<b>Subject:</b>
				{emlData.subject}
			</div>

			<hr />
		{/if}

		<!-- Body block -->
		{#if emlData.html || emlData.text}
			<div>
				<iframe srcdoc={emlData.html || `<pre>${emlData.text}</pre>`} class="w-full h-64"></iframe>
			</div>
		{/if}

		<!-- Body block -->
		{#if emlData.attachments}
			<!-- Block for file headers -->
			<div>
				<ul class="space-y-2 list-disc list-inside">
					{#each emlData.attachments as attachment}
						<li class="text-sm">
							{attachment.name} ({attachment.contentType}) {attachment.inline ? '(inline)' : ''}
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</div>

<style lang="scss">
.btn {
	@apply
		bg-gray-400
		enabled:hover:bg-gray-500
		disabled:bg-gray-300
		px-4
		py-2
		text-white
		font-semibold
		rounded-md
		disabled:cursor-not-allowed
		;

	&.btn-primary {
		@apply
			bg-blue-500
			enabled:hover:bg-blue-600
			disabled:bg-blue-300
			;
	}
}

textarea {
	@apply
		border
		border-gray-300
		;

	&.default {
		@apply text-gray-600
	}

	&.error {
		@apply border-red-600 text-red-600;
	}
}

</style>
