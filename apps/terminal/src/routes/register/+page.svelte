<script lang="ts">
  import { enhance } from '$app/forms';
  import TerminalIcon from '$lib/components/ui/TerminalIcon.svelte';

  import type { PageProps } from './$types';
  let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Register · AE2 Terminal</title></svelte:head>

<main class="auth-page">
  <section class="auth-terminal">
    <header class="auth-terminal-titlebar">
      <a class="wordmark auth-wordmark" href="/">
        <span class="wordmark-mark"
          ><TerminalIcon name="items" size={18} /></span
        >
        <span>ME Terminal</span>
      </a>
      <span>Account pairing</span>
    </header>

    <div class="auth-card">
      {#if form?.confirmationToken}
        <div class="success-mark" aria-hidden="true">✓</div>
        <p class="eyebrow">Registration created</p>
        <h1>Confirm in Minecraft</h1>
        <p>Run the command below in game to finish linking your account.</p>
        <div class="command-block">
          <span>In-game command</span><code
            >/ae2webintegration auth {form.confirmationToken}</code
          >
        </div>
        <a class="machine-button primary wide" href="/login"
          >Continue to sign in</a
        >
      {:else}
        <div>
          <p class="eyebrow">New player</p>
          <h1>Register</h1>
          <p>
            Join the server as the same username, then choose credentials for
            this terminal.
          </p>
        </div>
        {#if form?.error}<p class="inline-error" role="alert">
            {form.error}
          </p>{/if}
        <form method="POST" use:enhance>
          <label class="field"
            ><span>Minecraft username</span><input
              name="username"
              autocomplete="username"
              required
              value={form?.username ?? ''}
            /></label
          >
          <label class="field"
            ><span>Password</span><input
              name="password"
              type="password"
              autocomplete="new-password"
              required
            /></label
          >
          <label class="field"
            ><span>Confirm password</span><input
              name="passwordConfirmation"
              type="password"
              autocomplete="new-password"
              required
            /></label
          >
          <button class="machine-button primary wide" type="submit"
            >Create account</button
          >
        </form>
        <p class="auth-link">
          Already registered? <a href="/login">Sign in</a>
        </p>
      {/if}
      <small class="auth-version">Build {data.version}</small>
    </div>
  </section>
</main>
