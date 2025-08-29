<script lang="ts">
  import { page } from '$app/stores';
  const isActive = (path: string) => $page.url.pathname === path;
</script>

<header class="site-header">
  <nav class="nav">
    <span class="brand">GoalTracker</span>
    <a href="/" class:active={isActive('/')}>Login</a>
    <a href="/note" class:active={isActive('/note')}>Notes</a>
    <span class="spacer"></span>
  </nav>
</header>

<main><slot /></main>

<style>
  .site-header { border-bottom: 1px solid #eee; }
  .nav { display: flex; gap: 0.75rem; align-items: center; padding: .75rem 1rem; }
  .brand { font-weight: 600; margin-right: .5rem; }
  .spacer { flex: 1; }
  a { text-decoration: none; padding: .35rem .6rem; border-radius: .5rem; color: inherit; }
  a:hover { background: #f5f5f5; }
  a.active { background: #1a73e8; color: white; }
</style>
