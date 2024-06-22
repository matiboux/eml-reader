<script lang="ts">
import openedAttachmentIndex from '~/stores/openedAttachmentIndex'
import emlData from '~/stores/emlData'
import PdfFrame from '~/components/PdfFrame.svelte'

// Props
let userClass: string | undefined = undefined
let style: string | undefined = undefined
let locale: string | undefined = undefined
export {
	userClass as class,
	style,
	locale,
}

function closeModal()
{
	openedAttachmentIndex.set(null)
}

function onWrapperClick(event: MouseEvent)
{
	if (event.target === event.currentTarget)
	{
		closeModal()
	}
}
</script>

<div
	class={Array.from(new Set([
		'modal-wrapper',
		...(userClass ? userClass.split(' ') : []),
		...($openedAttachmentIndex !== null ? ['opened'] : []),
	])).join(' ')}
	style={style}
	on:click|preventDefault={onWrapperClick}
>

	<!-- <div class="modal">
		{$openedAttachmentIndex}
		{#if $openedAttachmentIndex !== null}
			<br />
			{$emlData?.attachments?.[$openedAttachmentIndex]?.name} <br />
			{$emlData?.attachments?.[$openedAttachmentIndex]?.contentType} <br />
			{$emlData?.attachments?.[$openedAttachmentIndex]?.data64 && bytes($emlData.attachments?.[$openedAttachmentIndex]?.data64.length)}
		{/if}
	</div> -->

	{#if $openedAttachmentIndex !== null}
		{#if $emlData?.attachments?.[$openedAttachmentIndex]?.contentType?.match(/^application\/pdf(?:$|;)/)}
			<div class="modal no-padding">
				<PdfFrame
					data64={$emlData?.attachments?.[$openedAttachmentIndex]?.data64}
				/>
			</div>
		{:else if $emlData?.attachments?.[$openedAttachmentIndex]?.contentType?.match(/^image\/(?:png|jpeg|gif)(?:$|;)/)}
			<div class="modal grow">
				<img
					src={$emlData?.attachments?.[$openedAttachmentIndex]?.data64}
					alt={$emlData?.attachments?.[$openedAttachmentIndex]?.name}
				/>
			</div>
		{:else}
			<div class="modal grow">
				<a
					href={$emlData?.attachments?.[$openedAttachmentIndex]?.data64}
					download={$emlData?.attachments?.[$openedAttachmentIndex]?.name}
				>
					Download
				</a>
			</div>
		{/if}
	{/if}

</div>

<style lang="scss">
:global(body):has(.modal-wrapper.opened) {
	overflow: hidden;
}

.modal-wrapper {
	@apply
		fixed
		bg-[#00000044]
		top-0
		left-0
		flex
		flex-col
		justify-center
		items-center
		gap-4
		w-full
		h-full
		p-4
		overflow-y-hidden
		z-[1000]
		;

	&:not(.opened) {
		@apply
			hidden
			;
	}

	.modal {
		@apply
			bg-gray-600
			w-full
			h-full
			max-w-[calc(1000px_+_2rem)]
			mx-auto
			p-6
			space-y-4
			overflow-y-auto
			rounded-lg
			shadow-lg
			border
			border-[#00000011]
			;

		&.no-padding {
			@apply
				p-0
				;
		}
	}
}
</style>
