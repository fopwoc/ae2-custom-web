<script lang="ts">
  import type { Item } from '@ae2-terminal/ae2-api';
  import { onMount } from 'svelte';

  import { api } from '$lib/api/browser-client';
  import { formatAmount } from '$lib/api/format';
  import type { TerminalState } from '$lib/features/terminal-state.svelte';
  import StatusNotice from '$lib/components/ui/StatusNotice.svelte';

  import CraftPlanner from './CraftPlanner.svelte';
  import InventoryGrid from './InventoryGrid.svelte';
  import InventoryList from './InventoryList.svelte';
  import ItemDetail from './ItemDetail.svelte';

  type ItemFilter = 'all' | 'stored' | 'craftable';
  type ViewMode = 'grid' | 'list';

  const viewPreferenceKey = 'ae2-inventory-view';

  let { state: terminal }: { state: TerminalState } = $props();
  let filter = $state<ItemFilter>('stored');
  let view = $state<ViewMode>('grid');
  let sort = $state<'name' | 'quantity'>('quantity');
  let plannerItem = $state<Item | null>(null);
  let cpuNames = $state<string[]>([]);

  let filteredItems = $derived(
    terminal.items
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
  });

  function selectView(nextView: ViewMode) {
    view = nextView;
    localStorage.setItem(viewPreferenceKey, nextView);
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

<section class="view-stack">
  <header class="view-heading">
    <div>
      <p class="eyebrow">Storage network</p>
      <h1>Inventory</h1>
      <p>{formatAmount(filteredItems.length)} matching item types</p>
    </div>
    <button
      class="button secondary refresh-button"
      type="button"
      onclick={() => terminal.loadCurrent()}
    >
      <span aria-hidden="true">↻</span> Refresh
    </button>
  </header>

  <div class="filter-bar">
    <fieldset class="segmented-control">
      <legend>Show</legend>
      <div>
        <label
          ><input
            type="radio"
            name="item-filter"
            value="all"
            bind:group={filter}
          /><span>All</span></label
        >
        <label
          ><input
            type="radio"
            name="item-filter"
            value="stored"
            bind:group={filter}
          /><span>Stored</span></label
        >
        <label
          ><input
            type="radio"
            name="item-filter"
            value="craftable"
            bind:group={filter}
          /><span>Craftable</span></label
        >
      </div>
    </fieldset>
    <span class="filter-spacer"></span>
    <label class="sort-control">
      <span>Sort</span>
      <select bind:value={sort}
        ><option value="quantity">Quantity</option><option value="name"
          >Name</option
        ></select
      >
    </label>
    <fieldset class="segmented-control view-control">
      <legend>View</legend>
      <div>
        <label>
          <input
            type="radio"
            name="inventory-view"
            value="grid"
            checked={view === 'grid'}
            onchange={() => selectView('grid')}
          />
          <span><span class="view-glyph" aria-hidden="true">▦</span>Grid</span>
        </label>
        <label>
          <input
            type="radio"
            name="inventory-view"
            value="list"
            checked={view === 'list'}
            onchange={() => selectView('list')}
          />
          <span><span class="view-glyph" aria-hidden="true">☷</span>List</span>
        </label>
      </div>
    </fieldset>
  </div>

  {#if terminal.busy && terminal.items.length === 0}
    <StatusNotice
      kind="loading"
      title="Reading storage"
      message="Loading item stacks from the selected network."
    />
  {:else if filteredItems.length === 0}
    <StatusNotice
      title="No matching items"
      message="Adjust the search or filters to see more of the network inventory."
    />
  {:else}
    <div
      class="inventory-layout"
      class:has-detail={terminal.selectedItem !== null}
    >
      {#if view === 'grid'}
        <InventoryGrid
          items={filteredItems}
          selected={terminal.selectedItem}
          onselect={(item) => (terminal.selectedItem = item)}
        />
      {:else}
        <InventoryList
          items={filteredItems}
          selected={terminal.selectedItem}
          onselect={(item) => (terminal.selectedItem = item)}
        />
      {/if}

      {#if terminal.selectedItem}
        <ItemDetail
          item={terminal.selectedItem}
          onclose={() => (terminal.selectedItem = null)}
          oncraft={() => openPlanner(terminal.selectedItem!)}
        />
      {/if}
    </div>
  {/if}
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
