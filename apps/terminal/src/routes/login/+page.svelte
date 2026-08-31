<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import TerminalIcon from '$lib/components/ui/TerminalIcon.svelte';

  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  let reveal = $state(false);
</script>

<svelte:head><title>Sign in · AE2 Terminal</title></svelte:head>

<main class="auth-page">
  <section class="auth-terminal">
    <header class="auth-terminal-titlebar">
      <a class="wordmark auth-wordmark" href="/">
        <span class="wordmark-mark"
          ><TerminalIcon name="items" size={18} /></span
        >
        <span>ME Terminal</span>
      </a>
      <span>Player access</span>
    </header>

    <div class="auth-card">
      <div>
        <p class="eyebrow">Remote storage access</p>
        <h1>Sign in</h1>
        <p>Use the credentials registered for the Minecraft server.</p>
      </div>
      {#if form?.error}<p class="inline-error" role="alert">
          {form.error}
        </p>{/if}
      {#if page.url.searchParams.has('expired')}<p
          class="inline-error"
          role="status"
        >
          Your session expired. Sign in again.
        </p>{/if}
      <form method="POST" use:enhance>
        <label class="field"
          ><span>Username</span><input
            name="username"
            autocomplete="username"
            required
            value={form?.username ?? ''}
          /></label
        >
        <label class="field"
          ><span>Password</span><span class="password-field"
            ><input
              name="password"
              type={reveal ? 'text' : 'password'}
              autocomplete="current-password"
              required
            /><button type="button" onclick={() => (reveal = !reveal)}
              >{reveal ? 'Hide' : 'Show'}</button
            ></span
          ></label
        >
        <label class="remember-control"
          ><input type="checkbox" name="remember" /><span
            >Keep me signed in on this device</span
          ></label
        >
        <button class="machine-button primary wide" type="submit"
          >Open terminal</button
        >
      </form>
      {#if data.publicMode}<p class="auth-link">
          New player? <a href="/register">Register an account</a>
        </p>{/if}
      <small class="auth-version">Build {data.version}</small>
    </div>
  </section>
</main>
