<script lang="ts">
  import { enhance } from '$app/forms';
  import { page } from '$app/state';

  import type { PageProps } from './$types';

  let { data, form }: PageProps = $props();
  let reveal = $state(false);
</script>

<svelte:head><title>Sign in · AE2 Terminal</title></svelte:head>

<main class="auth-page">
  <section class="auth-intro">
    <a class="wordmark auth-wordmark" href="/"
      ><span class="wordmark-mark">AE</span><span>Terminal</span></a
    >
    <div>
      <p class="eyebrow">Remote storage access</p>
      <h1>Your ME network,<br />without leaving the browser.</h1>
      <p>
        Search inventory, inspect crafting processors, and start jobs through
        your existing AE2 Web Integration account.
      </p>
    </div>
  </section>

  <section class="auth-card">
    <div>
      <p class="eyebrow">Player access</p>
      <h2>Sign in</h2>
      <p>Use the credentials registered for the Minecraft server.</p>
    </div>
    {#if form?.error}<p class="inline-error" role="alert">{form.error}</p>{/if}
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
      <button class="button primary wide" type="submit">Open terminal</button>
    </form>
    {#if data.publicMode}<p class="auth-link">
        New player? <a href="/register">Register an account</a>
      </p>{/if}
    <small class="auth-version">Build {data.version}</small>
  </section>
</main>
