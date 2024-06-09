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
				</a>
			{/if}
		</nav>

		<div class="paper-main">
			<div class="paper paper-back">
			</div>

			<div class="paper paper-front">
				{#if menuSelected === 'headers'}
					<div>
						<a
							on:click={handleMenuSelected('body')}
						>
							See message body
							<span class="icon icon-[mdi--chevron-right]"></span>
						</a>
					</div>

					{#if $emlData.attachments}
						<hr />

						<div>
							<a
								on:click={handleMenuSelected('attachments')}
							>
								See {$emlData.attachments.length} message attachment{#if $emlData.attachments.length > 1}s{/if}
								<span class="icon icon-[mdi--chevron-right]"></span>
							</a>
						</div>
					{/if}

					{#if $emlData.headers}
						<hr />

						<ul>
							{#each Object.entries($emlData.headers) as [key, value]}
								<li>
									<b>{key}:</b> {value}
								</li>
							{/each}
						</ul>
					{/if}

				{:else if menuSelected === 'attachments' && $emlData.attachments}
					<!-- Attachments block -->
					<ul>
						{#each $emlData.attachments as attachment}
							<li>
								<b>{attachment.name}</b> ({attachment.contentType})
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
							{$emlData.to.name ? `${$emlData.to.name} <${$emlData.to.email}>` : $emlData.to.email}
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
			}
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

		ul {
			@apply
				list-disc
				list-inside
				;
		}
	}
}
</style>
