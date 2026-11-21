<script lang="ts">
import type { Locales } from '~/i18n/type.d.ts'
import { i18nFactory } from '~/i18n'
import { parseEml } from '~/lib/parseEml'
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

let emlError: any = null

async function onChange(event: Event)
{
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (!file)
	{
		return
	}

	openedAttachmentIndex.set(null)

	try
	{
		const data = await parseEml(await file.arrayBuffer())
		emlError = null
		emlData.set(data)
	}
	catch (error)
	{
		emlError = error instanceof Error ? error.message : error
		emlData.set(null)
	}
	finally
	{
		target.value = ''
	}
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
			<div class="flex items-center gap-4">
				<input
					type="file"
					class="form-input"
					accept="message/rfc822"
					aria-label={_({
						'en': 'File',
						'fr': 'Fichier',
					})}
					on:change={onChange}
				/>
			</div>
		</div>
	</div>

	{#if emlError}
		<hr />

		<div>
			<b>
				{_({
					en: 'Error:',
					fr: 'Erreur :',
				})}
			</b>
			{emlError}
		</div>
	{/if}
</div>

<style lang="scss">
@reference "tailwindcss/theme";

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

// File input: a simple button with the file name beside it
.form-input {
	@apply
		min-w-0
		text-sm
		text-gray-600
		cursor-pointer
		file:mr-2
		file:px-2
		file:py-1
		file:border-0
		file:rounded-md
		file:bg-blue-500
		hover:file:bg-blue-600
		file:text-white
		file:font-semibold
		file:cursor-pointer
		;
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
