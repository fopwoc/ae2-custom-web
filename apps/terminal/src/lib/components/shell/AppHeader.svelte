<script lang="ts">
  import { onMount } from 'svelte';

  import { api, jsonRequest } from '$lib/api/browser-client';
  import type { TerminalState } from '$lib/features/terminal-state.svelte';

  let {
    state: terminal,
    username,
  }: { state: TerminalState; username: string } = $props();
  let searchInput: HTMLInputElement;
  let accountOpen = $state(false);

  onMount(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  });

  async function logout() {
    try {
      await api('/api/session', jsonRequest('DELETE'));
    } finally {
      window.location.assign('/login');
    }
  }
</script>

<header class="app-header">
  <a class="wordmark" href="/" aria-label="AE2 Terminal home">
    <span class="wordmark-mark" aria-hidden="true">AE</span>
    <span>Terminal</span>
  </a>

  <label class="network-control">
    <span>Network</span>
    <select
      value={terminal.selectedNetwork ?? ''}
      onchange={(event) =>
        terminal.chooseNetwork(Number(event.currentTarget.value))}
      aria-label="Active AE2 network"
    >
      {#each terminal.networks as network (network.key)}
        <option value={network.key}
          >{network.owner}{network.isOwned ? ' · personal' : ''}</option
        >
      {/each}
    </select>
  </label>

  <label class="command-search">
    <span class="search-icon" aria-hidden="true">⌕</span>
    <input
      bind:this={searchInput}
      bind:value={terminal.search}
      placeholder={terminal.tab === 'inventory'
        ? 'Search items'
        : 'Filter this view'}
      aria-label="Filter current view"
    />
    <kbd>⌘K</kbd>
  </label>

  <div class="account-menu">
    <button
      class="account-trigger"
      type="button"
      aria-expanded={accountOpen}
      onclick={() => (accountOpen = !accountOpen)}
    >
      <span class="avatar" aria-hidden="true"
        >{username.slice(0, 1).toUpperCase()}</span
      >
      <span>{username}</span>
      <span aria-hidden="true">⌄</span>
    </button>
    {#if accountOpen}
      <div class="account-popover">
        <span>Signed in as <strong>{username}</strong></span>
        <button type="button" onclick={logout}>Sign out</button>
      </div>
    {/if}
  </div>
</header>
