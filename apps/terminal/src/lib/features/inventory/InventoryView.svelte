<script lang="ts">
  import type { Item } from '@ae2-terminal/ae2-api';

  import { api } from '$lib/api/browser-client';
  import { formatAmount, itemNamespace } from '$lib/api/format';
  import type { TerminalState } from '$lib/features/terminal-state.svelte';
  import StatusNotice from '$lib/components/ui/StatusNotice.svelte';

  import CraftPlanner from './CraftPlanner.svelte';
  import ItemDetail from './ItemDetail.svelte';

  let { state: terminal }: { state: TerminalState } = $props();
  let craftableOnly = $state(false);
  let storedOnly = $state(true);
  let sort = $state<'name' | 'quantity'>('quantity');
  let plannerItem = $state<Item | null>(null);
  let cpuNames = $state<string[]>([]);

  let filteredItems = $derived(
    terminal.items
      .filter((item) => !craftableOnly || item.craftable)
      .filter((item) => !storedOnly || item.quantity > 0)
      .filter((item) => {
        const query = terminal.search.trim().toLowerCase();
        return !query || item.itemname.toLowerCase().includes(query) || item.itemid.toLowerCase().includes(query);
      })
      .toSorted((left, right) =>
        sort === 'name'
          ? left.itemname.localeCompare(right.itemname)
          : right.quantity - left.quantity || left.itemname.localeCompare(right.itemname)
      )
  );

  async function openPlanner(item: Item) {
    plannerItem = item;
    if (terminal.selectedNetwork === null) return;
    const cpus = await api<Record<string, unknown>>(`/api/networks/${terminal.selectedNetwork}/cpus`).catch(() => ({}));
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
    <button class="button secondary refresh-button" type="button" onclick={() => terminal.loadCurrent()}>
      <span aria-hidden="true">↻</span> Refresh
    </button>
  </header>

  <div class="filter-bar" aria-label="Inventory filters">
    <label class="switch-control"><input type="checkbox" bind:checked={storedOnly} /><span>Stored</span></label>
    <label class="switch-control"><input type="checkbox" bind:checked={craftableOnly} /><span>Craftable</span></label>
    <span class="filter-spacer"></span>
    <label class="sort-control">
      <span>Sort</span>
      <select bind:value={sort}><option value="quantity">Quantity</option><option value="name">Name</option></select>
    </label>
  </div>

  {#if terminal.busy && terminal.items.length === 0}
    <StatusNotice kind="loading" title="Reading storage" message="Loading item stacks from the selected network." />
  {:else if filteredItems.length === 0}
    <StatusNotice
      title="No matching items"
      message="Adjust the search or filters to see more of the network inventory."
    />
  {:else}
    <div class="inventory-layout" class:has-detail={terminal.selectedItem !== null}>
      <div class="item-list" role="list" aria-label="AE2 inventory">
        <div class="item-list-header" aria-hidden="true">
          <span>Item</span><span>Source</span><span>Available</span><span>Pattern</span>
        </div>
        {#each filteredItems as item (item.hashcode)}
          <button
            class="item-row"
            class:selected={terminal.selectedItem?.hashcode === item.hashcode}
            type="button"
            onclick={() => (terminal.selectedItem = item)}
          >
            <span class="item-identity">
              <span class="item-tile" aria-hidden="true">{itemNamespace(item.itemid).slice(0, 2)}</span>
              <span><strong>{item.itemname}</strong><code>{item.itemid}</code></span>
            </span>
            <span class="namespace">{itemNamespace(item.itemid)}</span>
            <strong class="quantity">{formatAmount(item.quantity)}</strong>
            <span class="craft-state" class:available={item.craftable}>{item.craftable ? 'Ready' : '—'}</span>
          </button>
        {/each}
      </div>

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
