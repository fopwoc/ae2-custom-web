<script lang="ts">
  import { formatAmount, itemNamespace } from '$lib/api/format';

  import type { InventoryItem } from './inventory-item';
  import ItemVisual from './ItemVisual.svelte';

  let {
    items,
    selected,
    onselect,
  }: {
    items: InventoryItem[];
    selected: InventoryItem | null;
    onselect: (item: InventoryItem) => void;
  } = $props();
</script>

<div class="item-list">
  <div class="item-list-header" aria-hidden="true">
    <span>Item</span><span>Source</span><span>Available</span><span
      >Pattern</span
    >
  </div>
  <ul class="item-list-rows" aria-label="AE2 inventory">
    {#each items as item (item.hashcode)}
      <li>
        <button
          class="item-row"
          class:selected={selected?.hashcode === item.hashcode}
          type="button"
          onclick={() => onselect(item)}
        >
          <span class="item-identity">
            <span class="item-tile" aria-hidden="true"><ItemVisual {item} /></span>
            <span
              ><strong>{item.itemname}</strong><code>{item.itemid}</code></span
            >
          </span>
          <span class="namespace">{itemNamespace(item.itemid)}</span>
          <strong class="quantity">{formatAmount(item.quantity)}</strong>
          <span class="craft-state" class:available={item.craftable}
            >{item.craftable ? 'Ready' : '—'}</span
          >
        </button>
      </li>
    {/each}
  </ul>
</div>
