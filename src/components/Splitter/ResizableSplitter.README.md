# ResizableSplitter (Vue 3)

This document defines the API contract and behavior for the `ResizableSplitter` component. It is the single source of truth for tooling (including AI) and contributors.

## Purpose

- Provide a simple vertical splitter (two stacked panels) with mouse/touch drag to resize.
- Persist current sizes to the parent via `v-model`-style emit (`update:panelSizes`).
- Enforce min/max constraints per panel in percentages.
- Offer optional initial size configuration in percent or pixels.

## Location

- File: `src/components/Splitter/ResizableSplitter.vue`

## Slots

- `#panel-a`: Content of the top panel.
- `#panel-b`: Content of the bottom panel.

## Props

- `panelSizes: [number, number]` (default: `[70, 30]`)
  - The current sizes in percentages that must sum to ~100. Top panel is index `0`, bottom panel is index `1`.

- `direction: 'horizontal' | 'vertical'` (default: `'horizontal'`)
  - Orientation of the splitter.
  - `horizontal`: panels stacked top (panel-a) and bottom (panel-b), sizes mapped to heights.
  - `vertical`: panels side-by-side left (panel-a) and right (panel-b), sizes mapped to widths.

- `minSize: [number, number]` (default: `[10, 10]`)
  - Minimum sizes (percent) per panel.

- `maxSize: [number, number]` (default: `[95, 95]`)
  - Maximum sizes (percent) per panel.

- `initialTopPanelPercent: number | null` (default: `null`)
  - Optional initial height for the top panel (percent). Applied on mount if provided.

- `initialTopPanelPixels: number | null` (default: `null`)
  - Optional initial height for the top panel (pixels). If both `initialTopPanelPixels` and `initialTopPanelPercent` are provided, pixels take priority. Applied on mount if the root has a measurable height.

Notes:

- Runtime updates to `panelSizes` prop will sync internal state. Sizes are always clamped by min/max and kept complementary to 100.

## Emits

- `update:panelSizes` with payload `[number, number]`
  - Emitted while dragging and after initialization, to support v-model-like usage on `panelSizes`.

- `resizeend` with payload `{ sizes: [number, number] }`
  - Emitted after the user stops dragging. Useful to trigger expensive relayouts (e.g., editors) once per interaction.

## Behavior

- Dragging the central handle updates the sizes in real-time, constrained by `minSize` and `maxSize`.
- Both mouse and touch interactions are supported.
- Orientation-aware behavior:
  - In `horizontal`, dragging is along the Y axis and sizes are applied to heights.
  - In `vertical`, dragging is along the X axis and sizes are applied to widths.
- On mount:
  - If `initialTopPanelPixels` is set and the component has a measurable height, it is converted to percent and applied.
  - Else if `initialTopPanelPercent` is set, it is applied directly.
  - Otherwise, `panelSizes` default (or provided prop) is used.
  - The component emits the initial sizes via `update:panelSizes` and `resizeend`.
- On unmount, event listeners are cleaned up.

## Styling

- Uses utility classes (Tailwind-like) plus CSS variables:
  - `--handle-bg` can be customized to change the handle background.
- The handle increases its inner line thickness on hover for a subtle affordance.

## Usage Examples

### Basic usage with defaults

```vue
<script setup>
  import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue'
</script>

<template>
  <div class="h-[400px]">
    <ResizableSplitter>
      <template #panel-a>
        <div class="p-3">Top content</div>
      </template>
      <template #panel-b>
        <div class="p-3">Bottom content</div>
      </template>
    </ResizableSplitter>
  </div>
</template>
```

### Vertical orientation (left-right)

```vue
<script setup>
  import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue'
</script>

<template>
  <div class="h-[400px]">
    <ResizableSplitter
      direction="vertical"
      :panelSizes="[40, 60]"
    >
      <template #panel-a>
        <div class="p-3">Left content</div>
      </template>
      <template #panel-b>
        <div class="p-3">Right content</div>
      </template>
    </ResizableSplitter>
  </div>
</template>
```

### Controlled sizes (v-model style via update:panelSizes)

```vue
<script setup>
  import { ref } from 'vue'
  import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue'

  const sizes = ref([60, 40])
</script>

<template>
  <div class="h-[400px]">
    <ResizableSplitter
      :panelSizes="sizes"
      @update:panelSizes="(val) => (sizes = val)"
      @resizeend="(e) => console.log('resize end', e.sizes)"
    >
      <template #panel-a>
        <div class="p-3">Resizable top</div>
      </template>
      <template #panel-b>
        <div class="p-3">Resizable bottom</div>
      </template>
    </ResizableSplitter>
  </div>
</template>
```

### With min/max and initial size

```vue
<script setup>
  import ResizableSplitter from '@/components/Splitter/ResizableSplitter.vue'
</script>

<template>
  <div class="h-[600px]">
    <ResizableSplitter
      :minSize="[20, 20]"
      :maxSize="[90, 90]"
      :initialTopPanelPercent="65"
    >
      <template #panel-a>
        <div class="p-3">Top constrained</div>
      </template>
      <template #panel-b>
        <div class="p-3">Bottom constrained</div>
      </template>
    </ResizableSplitter>
  </div>
</template>
```

## Non-goals

- No persistence/storage: the component only emits current sizes; persisting is responsibility of the parent.
- No horizontal splitter support (this component is vertical only).
- No multi-split panels.

## Integration Tips

- If embedding editors (e.g., Monaco), re-layout on `resizeend` to avoid excessive renders during drag.
- Ensure the container has a fixed height; panels use percentage-based heights.
