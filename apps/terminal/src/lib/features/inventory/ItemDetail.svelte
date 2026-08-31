<script lang="ts">
  import { formatAmount, itemNamespace } from '$lib/api/format';
  import { inventoryResourceKind } from '$lib/api/resource-kind';
  import TerminalIcon from '$lib/components/ui/TerminalIcon.svelte';

  import type { InventoryItem } from './inventory-item';
  import ItemVisual from './ItemVisual.svelte';

  let {
    item,
    onclose,
    oncraft,
  }: { item: InventoryItem; onclose: () => void; oncraft: () => void } =
    $props();
  let resourceKind = $derived(inventoryResourceKind(item));
</script>

<aside class="detail-panel" aria-label={`${item.itemname} details`}>
  <div class="panel-heading">
    <span class="item-tile large" aria-hidden="true"
      ><ItemVisual {item} lazy={false} /></span
    >
    <div>
      <p class="eyebrow">
        {resourceKind === 'fluid' ? 'Fluid' : 'Item'} detail
      </p>
      <h2>{item.itemname}</h2>
      <code>{item.itemid}</code>
    </div>
    <button
      class="machine-button icon-only"
      type="button"
      aria-label="Close item details"
      onclick={onclose}><TerminalIcon name="close" size={18} /></button
    >
  </div>

  <dl class="metric-grid">
    <div>
      <dt>Stored</dt>
      <dd>{formatAmount(item.quantity)}</dd>
    </div>
    <div>
      <dt>Crafting</dt>
      <dd>{item.craftable ? 'Pattern available' : 'Unavailable'}</dd>
    </div>
    <div>
      <dt>Registry</dt>
      <dd>
        {resourceKind === 'fluid' ? item.itemid : itemNamespace(item.itemid)}
      </dd>
    </div>
    <div>
      <dt>Hash</dt>
      <dd>{item.hashcode}</dd>
    </div>
  </dl>

  <div class="panel-actions">
    <button
      class="machine-button primary"
      type="button"
      disabled={!item.craftable}
      onclick={oncraft}
    >
      Create craft plan
    </button>
    {#if !item.craftable}<p>
        No crafting pattern is available for this {resourceKind}.
      </p>{/if}
  </div>
</aside>
