<script lang="ts">
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
		...(!$emlData ? ['hidden'] : []),
	])).join(' ')}
	style={style}
>
	{#if $emlData}
		<div class="paper-main paper">
			<!-- From block -->
			{#if $emlData.from}
				<div>
					<b>From:</b>
					{$emlData.from.name ? `${$emlData.from.name} <${$emlData.from.email}>` : $emlData.from.email}
				</div>

				<hr />
			{/if}

			<!-- To block -->
			{#if $emlData.to}
				<div>
					<b>To:</b>
					{$emlData.to.name ? `${$emlData.to.name} <${$emlData.to.email}>` : $emlData.to.email}
				</div>

				<hr />
			{/if}

			<!-- Subject block -->
			{#if $emlData.subject}
				<div>
					<b>Subject:</b>
					{$emlData.subject}
				</div>

				<hr />
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
		</div>
	{/if}

	<div class="papers-secondary">
		{#if $emlData && $emlData.attachments}
		 	{#each $emlData.attachments as attachment}
				<div class="paper paper-landscape">
					<b>Attachment:</b>
					{attachment.name}
					<!-- <button
						class="btn btn-primary"
						on:click={() => {
							const url = URL.createObjectURL(attachment.blob)
							const a = document.createElement('a')
							a.href = url
							a.download = attachment.filename
							a.click()
							URL.revokeObjectURL(url)
						}}
					>
						Download
					</button> -->
				</div>
			{/each}
		{/if}
	</div>
</div>

<style lang="scss">
.wrapper {
	@apply
		relative
		w-full
		flex
		flex-col
		justify-center
		gap-[calc(max(2.5rem,_5vh_/_1.414))]
		max-w-[calc(min(100%,_75vh_/_1.414))]
		;

	.paper {
		@apply
			relative
			flex
			flex-col
			w-full
			mx-auto
			space-y-4
			p-6
			;

		aspect-ratio: 1 / 1.414;

		&.paper-landscape {
			aspect-ratio: 1.414 / 1;
		}

		&, &::before {
			@apply
				bg-white
				rounded-lg
				shadow-lg
				border
				border-[#00000011]
				;
		}

		&::before {
			content: '';
			@apply
				absolute
				top-0
				left-0
				w-full
				h-full
				;
			display: block;
			transform: rotate(-4deg);
			margin-top: calc(-2% / 1.414);
			margin-left: -2%;
			z-index: -1;
		}
	}

	.paper-main {
		@apply
			min-h-[75vh]
			;
	}

	.papers-secondary {
		@apply
			flex
			w-[calc(max(10rem,_20vh_/_1.414))]
			h-full
			space-y-4
			;

		.paper {
			&::before {
				transform: rotate(-8deg);
			}
		}
	}
}

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
