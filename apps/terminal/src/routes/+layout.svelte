<script lang="ts">
  import '@fontsource-variable/ibm-plex-sans';
  import '@fontsource-variable/jetbrains-mono';
  import '@fontsource-variable/space-grotesk';
  import 'uno.css';
  import '../app.css';

  import type { LayoutProps } from './$types';

  let { children }: LayoutProps = $props();
</script>

{@render children()}
