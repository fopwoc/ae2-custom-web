<script lang="ts">
  import type { Item } from '@ae2-terminal/ae2-api';

  import { formatAmount, itemNamespace } from '$lib/api/format';

  let { item, onclose, oncraft }: { item: Item; onclose: () => void; oncraft: () => void } = $props();
</script>

<aside class="detail-panel" aria-label={`${item.itemname} details`}>
  <div class="panel-heading">
    <span class="item-tile large" aria-hidden="true">{itemNamespace(item.itemid).slice(0, 2)}</span>
    <div>
      <p class="eyebrow">Item detail</p>
      <h2>{item.itemname}</h2>
      <code>{item.itemid}</code>
    </div>
    <button class="icon-button" type="button" aria-label="Close item details" onclick={onclose}>×</button>
  </div>

  <dl class="metric-grid">
    <div><dt>Stored</dt><dd>{formatAmount(item.quantity)}</dd></div>
    <div><dt>Crafting</dt><dd>{item.craftable ? 'Pattern available' : 'Unavailable'}</dd></div>
    <div><dt>Namespace</dt><dd>{itemNamespace(item.itemid)}</dd></div>
    <div><dt>Hash</dt><dd>{item.hashcode}</dd></div>
  </dl>

  <div class="panel-actions">
    <button class="button primary" type="button" disabled={!item.craftable} onclick={oncraft}>
      Create craft plan
    </button>
    {#if !item.craftable}<p>No crafting pattern is available for this item.</p>{/if}
  </div>
</aside>
