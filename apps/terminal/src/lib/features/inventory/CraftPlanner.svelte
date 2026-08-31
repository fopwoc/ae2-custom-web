<script lang="ts">
  import type { CraftPlan } from '@ae2-terminal/ae2-api';

  import { api, jsonRequest } from '$lib/api/browser-client';
  import {
    formatAmount,
    formatBytes,
    formatCompactAmount,
    parseCompactAmount,
  } from '$lib/api/format';
  import TerminalIcon from '$lib/components/ui/TerminalIcon.svelte';

  import type { InventoryItem } from './inventory-item';
  import ItemVisual from './ItemVisual.svelte';

  let {
    network,
    item,
    cpus,
    onclose,
    onsubmitted,
  }: {
    network: number;
    item: InventoryItem;
    cpus: string[];
    onclose: () => void;
    onsubmitted: () => void;
  } = $props();

  let quantityInput = $state('1');
  let quantity = $derived(parseCompactAmount(quantityInput));
  let planId = $state<number | null>(null);
  let plan = $state<CraftPlan | null>(null);
  let selectedCpu = $state('');
  let busy = $state(false);
  let error = $state<string | null>(null);

  async function createPlan() {
    if (quantity === null) return;
    busy = true;
    error = null;
    try {
      const reference = await api<{ jobID: number }>(
        `/api/networks/${network}/craft-plans`,
        jsonRequest('POST', { item: item.hashcode, quantity }),
      );
      planId = reference.jobID;
      await pollPlan(reference.jobID);
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'Unable to create the craft plan';
      busy = false;
    }
  }

  async function pollPlan(id: number) {
    try {
      const result = await api<CraftPlan>(
        `/api/networks/${network}/craft-plans/${id}`,
      );
      plan = result;
      if (!result.isDone) {
        window.setTimeout(() => void pollPlan(id), 650);
      } else {
        busy = false;
      }
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'Unable to calculate the craft plan';
      busy = false;
    }
  }

  async function submit() {
    if (planId === null) return;
    busy = true;
    error = null;
    try {
      await api(
        `/api/networks/${network}/craft-plans/${planId}/submission`,
        jsonRequest('POST', { cpu: selectedCpu || undefined }),
      );
      onsubmitted();
    } catch (cause) {
      error =
        cause instanceof Error
          ? cause.message
          : 'Unable to submit the craft job';
      busy = false;
    }
  }

  async function close() {
    if (planId !== null && !plan?.isDone) {
      await api(
        `/api/networks/${network}/craft-plans/${planId}`,
        jsonRequest('DELETE'),
      ).catch(() => undefined);
    }
    onclose();
  }

  function adjustQuantity(delta: number) {
    const current = quantity ?? 1;
    quantityInput = formatCompactAmount(Math.max(1, current + delta));
  }
</script>

<div class="modal-backdrop" role="presentation">
  <div
    class="planner"
    role="dialog"
    aria-modal="true"
    aria-labelledby="planner-title"
  >
    <header class="planner-header terminal-titlebar">
      <div>
        <p class="eyebrow">ME crafting terminal</p>
        <h2 id="planner-title">Select amount</h2>
      </div>
      <button
        class="machine-button icon-only"
        type="button"
        aria-label="Close craft planner"
        onclick={close}
      >
        <TerminalIcon name="close" size={18} />
      </button>
    </header>

    {#if plan === null}
      <div class="planner-body amount-step">
        <div class="amount-buttons" aria-label="Increase requested amount">
          {#each [1, 10, 100, 1000] as amount}
            <button
              class="machine-button amount-button"
              type="button"
              onclick={() => adjustQuantity(amount)}>+{amount}</button
            >
          {/each}
        </div>

        <div class="amount-input-row">
          <span class="planner-item-slot" aria-hidden="true"
            ><ItemVisual {item} lazy={false} /></span
          >
          <div class="planner-item-label">
            <strong>{item.itemname}</strong>
            <code>{item.itemid}</code>
          </div>
          <label class="amount-field">
            <span>Amount</span>
            <input
              type="text"
              inputmode="decimal"
              autocomplete="off"
              spellcheck="false"
              bind:value={quantityInput}
              aria-invalid={quantity === null}
              aria-describedby={quantity === null ? 'amount-error' : undefined}
            />
          </label>
          <button
            class="machine-button primary next-button"
            type="button"
            disabled={busy || quantity === null}
            onclick={createPlan}
          >
            {busy ? 'Calculating…' : 'Next'}
          </button>
        </div>

        <div class="amount-buttons" aria-label="Decrease requested amount">
          {#each [1, 10, 100, 1000] as amount}
            <button
              class="machine-button amount-button"
              type="button"
              onclick={() => adjustQuantity(-amount)}>−{amount}</button
            >
          {/each}
        </div>

        <p class="amount-help">
          Use an exact number or a compact value such as 20k or 40m.
        </p>
        <p
          id="amount-error"
          class="amount-validation"
          class:inline-error={quantity === null}
          aria-live="polite"
        >
          {quantity === null
            ? 'Enter a positive amount using digits, k, m, or b.'
            : ''}
        </p>
        {#if error}<p class="inline-error">{error}</p>{/if}
      </div>
    {:else if !plan.isDone}
      <div class="planner-progress" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <h3>Calculating the craft</h3>
        <p>The AE2 crafting service is checking patterns and materials.</p>
      </div>
    {:else}
      <div class="planner-body">
        <div class="plan-summary">
          <div>
            <span>Requested</span><strong>{formatAmount(quantity ?? 0)}</strong>
          </div>
          <div>
            <span>Crafting bytes</span><strong
              >{formatBytes(plan.bytesTotal)}</strong
            >
          </div>
          <div>
            <span>Status</span><strong
              >{plan.isSimulating ? 'Simulating' : 'Ready'}</strong
            >
          </div>
        </div>

        <div class="table-scroll">
          <table>
            <thead
              ><tr
                ><th>Ingredient</th><th>Stored</th><th>Needed</th><th
                  >Missing</th
                ></tr
              ></thead
            >
            <tbody>
              {#each plan.plan ?? [] as ingredient (ingredient.itemid)}
                <tr class:danger-row={ingredient.missing > 0}>
                  <td
                    ><strong>{ingredient.itemname}</strong><code
                      >{ingredient.itemid}</code
                    ></td
                  >
                  <td>{formatAmount(ingredient.stored)}</td>
                  <td>{formatAmount(ingredient.requested)}</td>
                  <td>{formatAmount(ingredient.missing)}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <label class="field">
          <span>Crafting CPU</span>
          <select bind:value={selectedCpu}>
            <option value="">Automatic selection</option>
            {#each cpus as cpu}<option value={cpu}>{cpu}</option>{/each}
          </select>
        </label>
        {#if error}<p class="inline-error">{error}</p>{/if}
      </div>
      <footer class="planner-actions">
        <button class="button secondary" type="button" onclick={close}
          >Cancel</button
        >
        <button
          class="button primary"
          type="button"
          disabled={busy ||
            (plan.plan ?? []).some((entry) => entry.missing > 0)}
          onclick={submit}
        >
          {busy ? 'Submitting…' : 'Start crafting'}
        </button>
      </footer>
    {/if}
  </div>
</div>
