<script lang="ts">
  import { onMount } from 'svelte';

  import ActivityView from '$lib/features/activity/ActivityView.svelte';
  import CraftingView from '$lib/features/crafting/CraftingView.svelte';
  import InventoryView from '$lib/features/inventory/InventoryView.svelte';
  import { TerminalState } from '$lib/features/terminal-state.svelte';
  import AppHeader from '$lib/components/shell/AppHeader.svelte';
  import AppNavigation from '$lib/components/shell/AppNavigation.svelte';
  import StatusNotice from '$lib/components/ui/StatusNotice.svelte';

  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
  const terminal = createTerminal();

  function createTerminal(): TerminalState {
    return new TerminalState(data.networks);
  }

  onMount(() => {
    void terminal.restoreNetwork();
  });
</script>

<svelte:head>
  <title>AE2 Terminal</title>
  <meta name="description" content="A browser terminal for Applied Energistics 2." />
</svelte:head>

<div class="app-shell">
  <AppHeader state={terminal} username={data.session?.username ?? 'Player'} />
  <AppNavigation state={terminal} />

  <main class="workspace" id="main-content">
    {#if data.upstreamError}
      <StatusNotice kind="error" title="AE2 is unavailable" message={data.upstreamError} />
    {:else if terminal.networks.length === 0}
      <StatusNotice
        kind="empty"
        title="No accessible networks"
        message="Place a Wireless Access Point or configure a Security Terminal for this account, then refresh."
        action="Refresh networks"
        onaction={() => terminal.refreshNetworks()}
      />
    {:else if terminal.error}
      <StatusNotice
        kind="error"
        title="Could not load this view"
        message={terminal.error}
        action="Try again"
        onaction={() => terminal.loadCurrent()}
      />
    {:else if terminal.tab === 'inventory'}
      <InventoryView state={terminal} />
    {:else if terminal.tab === 'crafting'}
      <CraftingView state={terminal} />
    {:else}
      <ActivityView state={terminal} />
    {/if}
  </main>

  <footer class="build-footer">
    <span>AE2 Terminal {data.version}</span>
    <a href="https://github.com/kuba6000/AE2-Web-Integration">AE2 Web Integration</a>
  </footer>
</div>
