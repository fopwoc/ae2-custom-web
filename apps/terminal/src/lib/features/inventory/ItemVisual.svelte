<script lang="ts">
  import { itemNamespace } from '$lib/api/format';

  import type { InventoryItem } from './inventory-item';

  let {
    item,
    lazy = true,
  }: { item: InventoryItem; lazy?: boolean } = $props();
  let failedUrl = $state<string | null>(null);
  let showImage = $derived(
    item.iconUrl !== undefined && item.iconUrl !== failedUrl,
  );
</script>

{#if showImage}
  <img
    class="item-icon"
    src={item.iconUrl}
    alt=""
    loading={lazy ? 'lazy' : 'eager'}
    decoding="async"
    onerror={() => (failedUrl = item.iconUrl ?? null)}
  />
{:else}
  <span class="item-fallback">{itemNamespace(item.itemid).slice(0, 2)}</span>
{/if}
