<script lang="ts">
  import type { ActivityDetail } from '@ae2-terminal/ae2-api';

  import { api } from '$lib/api/browser-client';
  import { formatAmount, formatDate, formatDuration } from '$lib/api/format';
  import StatusNotice from '$lib/components/ui/StatusNotice.svelte';
  import type { TerminalState } from '$lib/features/terminal-state.svelte';

  let { state: terminal }: { state: TerminalState } = $props();
  let detail = $state<ActivityDetail | null>(null);
  let detailBusy = $state(false);

  let filteredActivity = $derived(
    terminal.activity.filter((activity) => {
      const query = terminal.search.trim().toLowerCase();
      return !query || activity.finalOutput.itemname.toLowerCase().includes(query) || activity.finalOutput.itemid.toLowerCase().includes(query);
    })
  );

  async function selectActivity(id: number) {
    if (terminal.selectedNetwork === null) return;
    terminal.selectedActivity = id;
    detailBusy = true;
    try {
      detail = await api<ActivityDetail>(`/api/networks/${terminal.selectedNetwork}/activity/${id}`);
    } catch (cause) {
      terminal.error = cause instanceof Error ? cause.message : 'Unable to load activity detail';
    } finally {
      detailBusy = false;
    }
  }
</script>

<section class="view-stack">
  <header class="view-heading activity-heading">
    <div>
      <p class="eyebrow">Crafting telemetry</p>
      <h1>Activity</h1>
      <p>Completed jobs and timing diagnostics</p>
    </div>
    <label class="tracking-toggle">
      <span><strong>Track jobs</strong><small>Stores crafting diagnostics in the mod</small></span>
      <input type="checkbox" checked={terminal.network?.isTrackingEnabled ?? false} onchange={(event) => terminal.setTracking(event.currentTarget.checked)} />
    </label>
  </header>

  {#if !terminal.network?.isTrackingEnabled}
    <StatusNotice title="Activity tracking is off" message="Enable tracking to record future crafting jobs and performance data." />
  {:else if terminal.busy && terminal.activity.length === 0}
    <StatusNotice kind="loading" title="Reading activity" message="Loading crafting history." />
  {:else if filteredActivity.length === 0}
    <StatusNotice title="No tracked jobs" message="Completed crafting jobs will appear here when tracking is enabled." />
  {:else}
    <div class="split-layout">
      <div class="activity-list" role="list" aria-label="Crafting activity">
        {#each filteredActivity as activity (activity.id)}
          <button class:selected={terminal.selectedActivity === activity.id} type="button" onclick={() => selectActivity(activity.id)}>
            <span class="activity-state" class:cancelled={activity.wasCancelled}>{activity.wasCancelled ? '×' : '✓'}</span>
            <span class="activity-main"><strong>{activity.finalOutput.itemname}</strong><small>{formatDate(activity.timeStarted)}</small></span>
            <span class="activity-quantity">× {formatAmount(activity.finalOutput.quantity)}</span>
            <span class="activity-duration">{formatDuration(activity.timeDone - activity.timeStarted)}</span>
          </button>
        {/each}
      </div>

      <aside class="detail-panel activity-detail">
        {#if detailBusy}
          <div class="panel-loading"><span class="spinner"></span><span>Reading activity</span></div>
        {:else if detail}
          <div class="panel-heading">
            <div><p class="eyebrow">Tracked job</p><h2>{detail.finalOutput.itemname}</h2><code>{detail.finalOutput.itemid}</code></div>
            <span class="status-pill" class:error={detail.wasCancelled}>{detail.wasCancelled ? 'Cancelled' : 'Completed'}</span>
          </div>
          <dl class="metric-grid">
            <div><dt>Produced</dt><dd>{formatAmount(detail.finalOutput.quantity)}</dd></div>
            <div><dt>Duration</dt><dd>{formatDuration(detail.timeDone - detail.timeStarted)}</dd></div>
            <div><dt>Ingredients</dt><dd>{detail.items.length}</dd></div>
            <div><dt>Interfaces</dt><dd>{detail.interfaceShare.length}</dd></div>
          </dl>
          <div class="ingredient-list">
            <div class="section-label"><span>Crafting work</span><span>Rate</span></div>
            {#each detail.items as item (item.itemid)}
              <div class="ingredient-row"><span><strong>{item.itemname}</strong><small>{formatDuration(item.timeSpentOn)}</small></span><span>{formatAmount(item.craftsPerSec)}/s</span></div>
            {/each}
          </div>
        {:else}
          <StatusNotice title="Select a job" message="Choose an activity entry to inspect timings and ingredients." />
        {/if}
      </aside>
    </div>
  {/if}
</section>
