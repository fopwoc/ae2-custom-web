<script lang="ts">
  import { api, jsonRequest } from '$lib/api/browser-client';
  import type { TerminalState } from '$lib/features/terminal-state.svelte';
  import TerminalIcon from '$lib/components/ui/TerminalIcon.svelte';

  let {
    state: terminal,
    username,
  }: { state: TerminalState; username: string } = $props();
  let accountOpen = $state(false);

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
    <span class="wordmark-mark" aria-hidden="true"
      ><TerminalIcon name="items" size={18} /></span
    >
    <span>ME Terminal</span>
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
      <span aria-hidden="true"><TerminalIcon name="chevron" size={14} /></span>
    </button>
    {#if accountOpen}
      <div class="account-popover">
        <span>Signed in as <strong>{username}</strong></span>
        <button type="button" onclick={logout}>Sign out</button>
      </div>
    {/if}
  </div>
</header>
