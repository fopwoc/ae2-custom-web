<script lang="ts">
  import '@fontsource-variable/ibm-plex-sans';
  import '@fontsource-variable/jetbrains-mono';
  import '@fontsource-variable/space-grotesk';
  import 'uno.css';
  import '../app.css';
  import '$lib/styles/ae2-shell.css';
  import '$lib/styles/ae2-inventory.css';
  import '$lib/styles/ae2-crafting.css';
  import '$lib/styles/ae2-auth.css';
  import '$lib/styles/ae2-responsive.css';

  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

{@render children()}
