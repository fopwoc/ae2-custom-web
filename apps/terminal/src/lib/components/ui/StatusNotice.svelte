<script lang="ts">
  let {
    kind = 'empty',
    title,
    message,
    action,
    onaction
  }: {
    kind?: 'empty' | 'error' | 'loading';
    title: string;
    message: string;
    action?: string;
    onaction?: () => void;
  } = $props();
</script>

<section class="status-notice" class:is-error={kind === 'error'} aria-live="polite">
  <span class="status-mark" aria-hidden="true">{kind === 'error' ? '!' : kind === 'loading' ? '…' : '◇'}</span>
  <div>
    <h2>{title}</h2>
    <p>{message}</p>
    {#if action && onaction}
      <button class="button secondary" type="button" onclick={onaction}>{action}</button>
    {/if}
  </div>
</section>
