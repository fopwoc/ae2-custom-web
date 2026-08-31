<script lang="ts">
  import type {
    TerminalState,
    TerminalTab,
  } from '$lib/features/terminal-state.svelte';
  import TerminalIcon, {
    type TerminalIconName,
  } from '$lib/components/ui/TerminalIcon.svelte';

  let { state }: { state: TerminalState } = $props();

  const tabs: { id: TerminalTab; label: string; icon: TerminalIconName }[] = [
    { id: 'inventory', label: 'Items', icon: 'items' },
    { id: 'crafting', label: 'Crafting', icon: 'processor' },
  ];
</script>

<nav class="app-navigation" aria-label="Terminal sections">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      class:active={state.tab === tab.id}
      aria-current={state.tab === tab.id ? 'page' : undefined}
      onclick={() => state.chooseTab(tab.id)}
    >
      <span class="nav-glyph"><TerminalIcon name={tab.icon} size={18} /></span>
      <span>{tab.label}</span>
      {#if tab.id === 'crafting' && state.network?.cpuCount}
        <span class="nav-count">{state.network.cpuCount}</span>
      {/if}
    </button>
  {/each}
</nav>
