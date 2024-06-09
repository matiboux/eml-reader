<script lang="ts">
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
</script>

<div
	class={Array.from(new Set([
		'wrapper',
		...(userClass ? userClass.split(' ') : []),
		...($openedAttachmentIndex !== null ? ['opened'] : []),
	])).join(' ')}
	style={style}
>

	<div class="modal-wrapper">
		<div class="modal">
			{$openedAttachmentIndex}
			{#if $openedAttachmentIndex !== null}
				<br />
				{$emlData?.attachments?.[$openedAttachmentIndex]?.name} <br />
				{$emlData?.attachments?.[$openedAttachmentIndex]?.contentType} <br />
				<!-- {$emlData?.attachments?.[$openedAttachmentIndex]?.data64} <br /> -->
				{$emlData?.attachments?.[$openedAttachmentIndex]?.data64 && bytes($emlData.attachments?.[$openedAttachmentIndex]?.data64.length)}
			{/if}
		</div>
	</div>

</div>

<style lang="scss">
.wrapper {
	@apply
		fixed
		bg-[#00000044]
		top-0
		left-0
		flex
		flex-col
		justify-center
		items-center
		gap-8
		w-full
		h-full
		overflow-y-hidden
		z-[1000]
		;

	&:not(.opened) {
		@apply
			hidden
			;
	}

	.modal-wrapper {
		@apply
			flex
			flex-col
			justify-center
			items-center
			gap-8
			w-full
			max-w-[calc(1000px+2*2rem)]
			mx-auto
			p-8
			;

		.modal {
			@apply
				bg-white
				shadow-lg
				rounded-lg
				w-full
				p-6
				space-y-4
				;
		}
	}
}
</style>
