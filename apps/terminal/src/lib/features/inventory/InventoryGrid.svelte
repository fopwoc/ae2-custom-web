<script lang="ts">
  import { formatAmount } from '$lib/api/format';

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

<ul class="item-grid" aria-label="AE2 inventory">
  {#each items as item (item.hashcode)}
    <li>
      <button
        class="item-slot"
        class:selected={selected?.hashcode === item.hashcode}
        type="button"
        aria-label={`${item.itemname}, ${formatAmount(item.quantity)} available${item.craftable ? ', craftable' : ''}`}
        title={`${item.itemname}\n${item.itemid}`}
        onclick={() => onselect(item)}
      >
        <span
          class="item-slot-visual"
          class:has-icon={item.iconUrl !== undefined}
          aria-hidden="true"
        >
          <ItemVisual {item} />
          {#if item.craftable}<span class="craft-marker">C</span>{/if}
          <strong class="item-slot-quantity"
            >{formatAmount(item.quantity)}</strong
          >
        </span>
        <span class="item-slot-name">{item.itemname}</span>
      </button>
    </li>
  {/each}
</ul>
