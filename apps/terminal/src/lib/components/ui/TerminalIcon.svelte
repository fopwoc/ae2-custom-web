<script lang="ts">
  export type TerminalIconName =
    | 'activity'
    | 'chevron'
    | 'close'
    | 'craft'
    | 'essentia'
    | 'filter'
    | 'fluid'
    | 'grid'
    | 'items'
    | 'list'
    | 'processor'
    | 'refresh'
    | 'search'
    | 'sort';

  let { name, size = 20 }: { name: TerminalIconName; size?: number } = $props();
</script>

<svg
  class="terminal-icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.8"
  stroke-linecap="square"
  stroke-linejoin="miter"
  aria-hidden="true"
>
  {#if name === 'items' || name === 'grid'}
    <rect x="3" y="3" width="7" height="7" /><rect
      x="14"
      y="3"
      width="7"
      height="7"
    />
    <rect x="3" y="14" width="7" height="7" /><rect
      x="14"
      y="14"
      width="7"
      height="7"
    />
  {:else if name === 'list'}
    <path d="M8 5h13M8 12h13M8 19h13" /><path d="M3 5h1M3 12h1M3 19h1" />
  {:else if name === 'processor'}
    <rect x="6" y="6" width="12" height="12" /><path
      d="M9 1v5M15 1v5M9 18v5M15 18v5M1 9h5M1 15h5M18 9h5M18 15h5"
    />
    <rect x="10" y="10" width="4" height="4" />
  {:else if name === 'craft'}
    <path d="m4 20 7-7M10 6l3-3 4 1 3 3-3 3-4-1-3 3-2-2 3-3Z" />
  {:else if name === 'search'}
    <circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" />
  {:else if name === 'sort'}
    <path d="M8 5h12M8 12h8M8 19h4M3 4v16M1 18l2 2 2-2" />
  {:else if name === 'filter'}
    <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
  {:else if name === 'fluid'}
    <path d="M12 2s7 8 7 13a7 7 0 0 1-14 0c0-5 7-13 7-13Z" />
  {:else if name === 'essentia'}
    <path d="M12 2 5 7v10l7 5 7-5V7Z" /><circle cx="12" cy="12" r="3" />
  {:else if name === 'refresh'}
    <path d="M20 6v6h-6M4 18v-6h6" /><path
      d="M18 10a7 7 0 0 0-12-3l-2 2M6 14a7 7 0 0 0 12 3l2-2"
    />
  {:else if name === 'close'}
    <path d="M5 5l14 14M19 5 5 19" />
  {:else if name === 'chevron'}
    <path d="m8 10 4 4 4-4" />
  {:else}
    <path d="M4 19h16M6 16V9M12 16V4M18 16v-5" />
  {/if}
</svg>
