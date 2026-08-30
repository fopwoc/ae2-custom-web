<script lang="ts">
  import type { TerminalState, TerminalTab } from '$lib/features/terminal-state.svelte';

  let { state }: { state: TerminalState } = $props();

  const tabs: { id: TerminalTab; label: string; glyph: string }[] = [
    { id: 'inventory', label: 'Inventory', glyph: '▦' },
    { id: 'crafting', label: 'Crafting CPUs', glyph: '⌁' },
    { id: 'activity', label: 'Activity', glyph: '≋' }
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
      <span class="nav-glyph" aria-hidden="true">{tab.glyph}</span>
      <span>{tab.label}</span>
      {#if tab.id === 'crafting' && state.network?.cpuCount}
        <span class="nav-count">{state.network.cpuCount}</span>
      {/if}
    </button>
  {/each}
</nav>
