<script lang="ts">
import emlData from '~/stores/emlData'

// Props
let userClass: string | undefined = undefined
export { userClass as class }
</script>

<!-- Hides its content once an e-mail is loaded -->
<div class={`${userClass ?? ''} ${$emlData ? 'hidden' : ''}`}>
	<slot />
</div>
