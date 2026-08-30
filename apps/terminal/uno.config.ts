import { defineConfig, presetWind3 } from "unocss";

export default defineConfig({
  presets: [presetWind3()],
  shortcuts: {
    "cluster-row": "flex items-center gap-[var(--space-sm)]",
    "focus-ring": "focus-visible:outline-2 focus-visible:outline-offset-2",
    "mono-label":
      "font-[var(--font-mono)] text-[var(--text-xs)] tracking-[0.06em] uppercase",
    "surface-rule": "border border-[var(--color-rule)] bg-[var(--color-paper)]",
  },
});
