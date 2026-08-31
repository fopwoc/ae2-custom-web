# Design — AE2 Terminal

A locked design system for this app. Every page reads this file before visual changes are made. Extend this system when the interface grows; do not create per-page themes.

## Genre

Technical utilitarian. The browser interface borrows the information hierarchy and control placement of the in-game AE2 terminal without copying Minecraft pixels, textures, or fixed-resolution constraints.

## Macrostructure family

- App pages: **Terminal Chassis** — a bounded terminal body with a compact title bar, dedicated control rails, and one dominant data bay.
- Authentication pages: **Terminal Gate** — one focused machine panel; no marketing split-screen.
- Content pages: not applicable.

The authenticated terminal has exactly two top-level modes: **Items** and **Crafting**. Activity/history may live inside Crafting, never as a third primary mode.

## Theme

Custom theme: **machined grey, recessed, dense, cyan signal**.

- `--color-paper`: `oklch(79% 0.010 245)` — page field
- `--color-paper-2`: `oklch(87% 0.009 245)` — terminal chassis
- `--color-paper-3`: `oklch(72% 0.011 245)` — inset controls
- `--color-ink`: `oklch(20% 0.014 250)` — primary ink
- `--color-ink-2`: `oklch(32% 0.013 250)` — secondary ink
- `--color-muted`: `oklch(30% 0.012 250)` — accessible secondary labels
- `--color-rule`: `oklch(56% 0.011 245)` — slot divisions
- `--color-accent`: `oklch(72% 0.15 210)` — selected state
- `--color-focus`: `oklch(42% 0.20 210)` — keyboard focus

The accent is a signal, not a fill system. It appears on the selected mode, selected CPU, focus rings, and real progress. Dark mode preserves the same hue and elevation ordering.

## Typography

- Display: Space Grotesk, weight 700, roman
- Body: IBM Plex Sans, weight 400
- Mono: JetBrains Mono, weight 500, for quantities, IDs, and compact controls
- Display tracking: `-0.025em`
- Type scale: compact major-third scale; application headings top out at `1.953rem`

No pixel font. The AE2 relationship comes from density, bevel hierarchy, slot geometry, and control placement.

## Spacing

Four-point named scale in `tokens.css`. Slot gaps may use the 2 px step to reproduce a continuous terminal matrix; touch controls remain at least 44 px.

## Motion

- Pressed controls translate by 1 px for at most 120 ms.
- Tab content changes without spatial motion.
- Craft progress is functional and updates directly without layout animation.
- Reduced motion makes all non-functional transitions instant.

## Microinteractions stance

- Silent success.
- Tooltips: 800 ms on hover, immediate on focus.
- Focus rings appear instantly.
- Exact item counts are available through hover/focus text and selected-item detail.
- No hover-only action: tapping a craftable item opens the craft request.

## Control voice

- Primary actions use raised machine buttons with square corners and clear verb labels.
- Secondary actions use the same geometry at lower contrast.
- Cycle controls always show their current mode in text and expose the next mode in their accessible label.
- Disabled protocol modes explain why they are unavailable.

## Item terminal

- Nine square slots per row on desktop.
- Each slot contains an icon, a compact lowercase quantity at bottom-right, and a small craftable mark at top-right.
- Full count and item identity remain available through title/accessible text and detail state.
- Search sits at the top-right of the data bay.
- Resource type buttons form the first left rail; sort, stored/craftable filter, and grid/list mode form the second.
- GTNH fluids are distinguished by their unnamespaced fluid registry ID, while the `ae2fc:fluid_drop:0` identity remains supported for upstream-compatible payloads. Namespaced BartWorks cells remain items.
- Items and fluids are independently toggleable. Essentia stays disabled until the upstream payload exposes a stable identity for it.

## Crafting terminal

- CPU list at left.
- Selected CPU and its active/pending ingredients occupy the main bay in a three-column processor grid.
- Busy CPUs show their output icon when it can be resolved from the item inventory.
- Progress is derived only from real detail data; storage usage is never presented as job progress.

## Craft request

- Selected item icon and name remain visible.
- Quantity accepts integers plus `k`, `m`, and `b` suffixes.
- Fast controls: ±1, ±10, ±100, ±1000.
- Planning and submission stay separate because the server must simulate materials before starting a job.

## Per-page allowances

- App pages contain no decorative enrichment.
- Authentication may use the terminal chassis but no fake Minecraft screenshot or browser chrome.
- Item artwork comes only from the configured icon pack.

## What pages MUST share

- Chassis, bevel, slot, focus, and button geometry.
- Accent hue and placement.
- Display/body/mono font roles.
- Compact control labels and tabular numerals.
- Light/dark elevation logic.

## What pages MAY differ on

- Number and width of data bays.
- Whether the control rail is visible or collapses into a compact toolbar.
- Grid column count below the desktop breakpoint.

## Exports

### tokens.css

```css
:root {
  --color-paper: oklch(79% 0.01 245);
  --color-paper-2: oklch(87% 0.009 245);
  --color-paper-3: oklch(72% 0.011 245);
  --color-ink: oklch(20% 0.014 250);
  --color-ink-2: oklch(32% 0.013 250);
  --color-rule: oklch(56% 0.011 245);
  --color-accent: oklch(72% 0.15 210);
  --color-accent-ink: oklch(18% 0.014 250);
  --color-focus: oklch(42% 0.2 210);
  --font-display: "Space Grotesk", sans-serif;
  --font-body: "IBM Plex Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-micro: 120ms;
  --radius-control: 0.125rem;
}
```

### Tailwind v4 `@theme`

```css
@theme {
  --color-paper: oklch(79% 0.01 245);
  --color-panel: oklch(87% 0.009 245);
  --color-ink: oklch(20% 0.014 250);
  --color-accent: oklch(72% 0.15 210);
  --font-display: "Space Grotesk", sans-serif;
  --font-body: "IBM Plex Sans", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  --spacing-md: 1rem;
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
}
```

### DTCG `tokens.json`

```json
{
  "color": {
    "paper": { "$value": "oklch(79% 0.010 245)", "$type": "color" },
    "panel": { "$value": "oklch(87% 0.009 245)", "$type": "color" },
    "ink": { "$value": "oklch(20% 0.014 250)", "$type": "color" },
    "accent": { "$value": "oklch(72% 0.15 210)", "$type": "color" }
  },
  "font": {
    "display": { "$value": "Space Grotesk", "$type": "fontFamily" },
    "body": { "$value": "IBM Plex Sans", "$type": "fontFamily" },
    "mono": { "$value": "JetBrains Mono", "$type": "fontFamily" }
  },
  "space": {
    "md": { "$value": "1rem", "$type": "dimension" }
  }
}
```

### shadcn/ui CSS variables

```css
:root {
  --background: 79% 0.01 245;
  --foreground: 20% 0.014 250;
  --primary: 72% 0.15 210;
  --primary-foreground: 18% 0.014 250;
  --muted: 72% 0.011 245;
  --muted-foreground: 30% 0.012 250;
  --border: 56% 0.011 245;
  --input: 56% 0.011 245;
  --ring: 42% 0.2 210;
  --radius: 0.125rem;
}
```
