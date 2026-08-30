<script lang="ts">
  import { enhance } from '$app/forms';

  import type { PageProps } from './$types';
  let { data, form }: PageProps = $props();
</script>

<svelte:head><title>Register · AE2 Terminal</title></svelte:head>

<main class="auth-page">
  <section class="auth-intro">
    <a class="wordmark auth-wordmark" href="/"><span class="wordmark-mark">AE</span><span>Terminal</span></a>
    <div><p class="eyebrow">Account pairing</p><h1>Connect your player identity.</h1><p>Registration only works while your Minecraft player is online. The mod uses that live identity to bind this account.</p></div>
    <div class="command-block"><span>Before you continue</span><code>Join the server as the same username</code></div>
  </section>

  <section class="auth-card">
    {#if form?.confirmationToken}
      <div class="success-mark" aria-hidden="true">✓</div>
      <p class="eyebrow">Registration created</p>
      <h2>Confirm in Minecraft</h2>
      <p>Run the command below in game to finish linking your account.</p>
      <div class="command-block"><span>In-game command</span><code>/ae2webintegration auth {form.confirmationToken}</code></div>
      <a class="button primary wide" href="/login">Continue to sign in</a>
    {:else}
      <div><p class="eyebrow">New player</p><h2>Register</h2><p>Choose credentials for this web terminal.</p></div>
      {#if form?.error}<p class="inline-error" role="alert">{form.error}</p>{/if}
      <form method="POST" use:enhance>
        <label class="field"><span>Minecraft username</span><input name="username" autocomplete="username" required value={form?.username ?? ''} /></label>
        <label class="field"><span>Password</span><input name="password" type="password" autocomplete="new-password" required /></label>
        <label class="field"><span>Confirm password</span><input name="passwordConfirmation" type="password" autocomplete="new-password" required /></label>
        <button class="button primary wide" type="submit">Create account</button>
      </form>
      <p class="auth-link">Already registered? <a href="/login">Sign in</a></p>
    {/if}
    <small class="auth-version">Build {data.version}</small>
  </section>
</main>
