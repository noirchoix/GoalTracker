<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';

  import { fade, fly } from 'svelte/transition';
  import { page } from '$app/stores';

  let { children,data } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon} />
</svelte:head>

{#if data?.user}
  <form method="POST" action="/logout" class="logout-fixed" aria-label="Logout">
    <button type="submit" class="logout-btn">Logout</button>
  </form>
{/if}

{#key $page.url.pathname}
  <div
    class={$page.url.pathname === '/' ? 'page page--right' : 'page page--center'}
    in:fade={{ duration: 220 }}
    out:fade={{ duration: 160 }}
    style="will-change: opacity, transform"
  >
    {@render children?.()}
  </div>
{/key}