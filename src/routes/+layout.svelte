<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';

  // Add these:
  import { fade, fly } from 'svelte/transition';
  import { page } from '$app/stores';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#key $page.url.pathname}
  <div
    in:fade={{ duration: 220 }}
    out:fade={{ duration: 160 }}
    style="will-change: opacity, transform"
  >
    {@render children?.()}
  </div>
{/key}
