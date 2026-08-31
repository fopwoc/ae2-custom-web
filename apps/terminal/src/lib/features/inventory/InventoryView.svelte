<script lang="ts">
  import type { Item } from '@ae2-terminal/ae2-api';
  import { onMount } from 'svelte';

  import { api } from '$lib/api/browser-client';
  import { formatAmount } from '$lib/api/format';
  import { inventoryResourceKind } from '$lib/api/resource-kind';
  import type { TerminalState } from '$lib/features/terminal-state.svelte';
  import StatusNotice from '$lib/components/ui/StatusNotice.svelte';
  import TerminalIcon, {
    type TerminalIconName,
  } from '$lib/components/ui/TerminalIcon.svelte';

  import CraftPlanner from './CraftPlanner.svelte';
  import InventoryGrid from './InventoryGrid.svelte';
  import InventoryList from './InventoryList.svelte';
  import ItemDetail from './ItemDetail.svelte';

  type ItemFilter = 'all' | 'stored' | 'craftable';
  type ViewMode = 'grid' | 'list';
  type SortMode = 'quantity' | 'name';

  const resourceControls: {
    id: 'items' | 'fluids' | 'essentia';
    label: string;
    icon: TerminalIconName;
    available: boolean;
  }[] = [
    { id: 'items', label: 'Items', icon: 'items', available: true },
    { id: 'fluids', label: 'Fluids', icon: 'fluid', available: true },
    { id: 'essentia', label: 'Essentia', icon: 'essentia', available: false },
  ];

  const viewPreferenceKey = 'ae2-inventory-view';

  let { state: terminal }: { state: TerminalState } = $props();
  let filter = $state<ItemFilter>('all');
  let view = $state<ViewMode>('grid');
  let sort = $state<SortMode>('quantity');
  let itemsEnabled = $state(true);
  let fluidsEnabled = $state(true);
  let plannerItem = $state<Item | null>(null);
  let cpuNames = $state<string[]>([]);
  let searchInput: HTMLInputElement;

  let filteredItems = $derived(
    terminal.items
      .filter((item) =>
        inventoryResourceKind(item) === 'fluid' ? fluidsEnabled : itemsEnabled,
      )
      .filter(
        (item) =>
          filter === 'all' ||
          (filter === 'stored' ? item.quantity > 0 : item.craftable),
      )
      .filter((item) => {
        const query = terminal.search.trim().toLowerCase();
        return (
          !query ||
          item.itemname.toLowerCase().includes(query) ||
          item.itemid.toLowerCase().includes(query)
        );
      })
      .toSorted((left, right) =>
        sort === 'name'
          ? left.itemname.localeCompare(right.itemname)
          : right.quantity - left.quantity ||
            left.itemname.localeCompare(right.itemname),
      ),
  );

  onMount(() => {
    const savedView = localStorage.getItem(viewPreferenceKey);
    if (savedView === 'grid' || savedView === 'list') view = savedView;

    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchInput?.focus();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  });

  function selectView(nextView: ViewMode) {
    view = nextView;
    localStorage.setItem(viewPreferenceKey, nextView);
  }

  function cycleSort() {
    sort = sort === 'quantity' ? 'name' : 'quantity';
  }

  function cycleFilter() {
    filter =
      filter === 'all'
        ? 'craftable'
        : filter === 'craftable'
          ? 'stored'
          : 'all';
  }

  function cycleView() {
    selectView(view === 'grid' ? 'list' : 'grid');
  }

  function resourceEnabled(resource: 'items' | 'fluids' | 'essentia') {
    return resource === 'items'
      ? itemsEnabled
      : resource === 'fluids'
        ? fluidsEnabled
        : false;
  }

  function toggleResource(resource: 'items' | 'fluids' | 'essentia') {
    if (resource === 'items') itemsEnabled = !itemsEnabled;
    if (resource === 'fluids') fluidsEnabled = !fluidsEnabled;
  }

  function selectItem(item: Item) {
    if (item.craftable) {
      void openPlanner(item);
      return;
    }
    terminal.selectedItem = item;
  }

  async function openPlanner(item: Item) {
    plannerItem = item;
    if (terminal.selectedNetwork === null) return;
    const cpus = await api<Record<string, unknown>>(
      `/api/networks/${terminal.selectedNetwork}/cpus`,
    ).catch(() => ({}));
    cpuNames = Object.keys(cpus);
  }
</script>

<section class="terminal-view inventory-terminal">
  <div class="inventory-toolbar">
    <span class="result-count" aria-live="polite"
      >{formatAmount(filteredItems.length)} types</span
    >
    <label class="terminal-search">
      <TerminalIcon name="search" size={18} />
      <input
        bind:this={searchInput}
        bind:value={terminal.search}
        placeholder="Search items"
        aria-label="Search items"
      />
      <kbd>⌘K</kbd>
    </label>
    <button
      class="machine-button icon-only"
      type="button"
      aria-label="Refresh items"
      title="Refresh items"
      onclick={() => terminal.loadCurrent()}
    >
      <TerminalIcon name="refresh" size={18} />
    </button>
  </div>

  <div
    class="inventory-workbench"
    class:has-detail={terminal.selectedItem !== null}
  >
    <aside class="resource-rail" aria-label="Resource types">
      {#each resourceControls as resource (resource.id)}
        <button
          class="machine-button rail-button"
          class:active={resourceEnabled(resource.id)}
          type="button"
          disabled={!resource.available}
          aria-pressed={resource.available
            ? resourceEnabled(resource.id)
            : false}
          aria-label={resource.available
            ? `${resource.label}: ${resourceEnabled(resource.id) ? 'shown' : 'hidden'}`
            : `${resource.label}: unavailable`}
          title={resource.available
            ? `${resource.label}: ${resourceEnabled(resource.id) ? 'shown' : 'hidden'}`
            : `${resource.label} are not exposed by AE2 Web Integration`}
          onclick={() => toggleResource(resource.id)}
        >
          <TerminalIcon name={resource.icon} size={19} />
          <span>{resource.label}</span>
        </button>
      {/each}
    </aside>

    <aside class="mode-rail" aria-label="Inventory display controls">
      <button
        class="machine-button cycle-button"
        type="button"
        onclick={cycleSort}
        aria-label={`Sort: ${sort === 'quantity' ? 'quantity' : 'item name'}. Activate to cycle.`}
      >
        <TerminalIcon name="sort" size={19} />
        <span>Sort</span><strong
          >{sort === 'quantity' ? 'Count' : 'Name'}</strong
        >
      </button>
      <button
        class="machine-button cycle-button"
        type="button"
        onclick={cycleFilter}
        aria-label={`Show: ${filter}. Activate to cycle.`}
      >
        <TerminalIcon name="filter" size={19} />
        <span>Show</span><strong
          >{filter === 'stored'
            ? 'Stored'
            : filter === 'craftable'
              ? 'Craftable'
              : 'All'}</strong
        >
      </button>
      <button
        class="machine-button cycle-button"
        type="button"
        onclick={cycleView}
        aria-label={`View: ${view}. Activate to cycle.`}
      >
        <TerminalIcon name={view === 'grid' ? 'grid' : 'list'} size={19} />
        <span>View</span><strong>{view === 'grid' ? 'Grid' : 'List'}</strong>
      </button>
    </aside>

    <div class="inventory-bay">
      {#if terminal.busy && terminal.items.length === 0}
        <StatusNotice
          kind="loading"
          title="Reading storage"
          message="Loading item stacks from the selected network."
        />
      {:else if !itemsEnabled && !fluidsEnabled}
        <StatusNotice
          title="Resources are hidden"
          message="Turn Items or Fluids back on to display stored and craftable resources."
        />
      {:else if filteredItems.length === 0}
        <StatusNotice
          title="No matching items"
          message="Change the search or cycle the Show control."
        />
      {:else if view === 'grid'}
        <InventoryGrid
          items={filteredItems}
          selected={terminal.selectedItem}
          onselect={selectItem}
        />
      {:else}
        <InventoryList
          items={filteredItems}
          selected={terminal.selectedItem}
          onselect={selectItem}
        />
      {/if}
    </div>

    {#if terminal.selectedItem}
      <ItemDetail
        item={terminal.selectedItem}
        onclose={() => (terminal.selectedItem = null)}
        oncraft={() => openPlanner(terminal.selectedItem!)}
      />
    {/if}
  </div>
</section>

{#if plannerItem && terminal.selectedNetwork !== null}
  <CraftPlanner
    network={terminal.selectedNetwork}
    item={plannerItem}
    cpus={cpuNames}
    onclose={() => (plannerItem = null)}
    onsubmitted={() => {
      plannerItem = null;
      void terminal.chooseTab('crafting');
    }}
  />
{/if}
