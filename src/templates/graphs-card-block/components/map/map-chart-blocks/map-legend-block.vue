<template>
  <div
    id="map-legend-block"
    class="w-44 h-32 absolute bottom-3 right-3 surface-card rounded border surface-border px-4 py-3 flex flex-col gap-2 text-color"
  >
    <p class="text-sm font-medium">{{ title }}</p>
    <ul class="flex flex-col gap-1">
      <li
        v-for="caption in captions"
        :key="caption.label"
        class="text-xs flex items-center gap-1"
      >
        <span
          class="w-2 h-2 border"
          :class="caption.bullet"
        />
        {{ caption.label }}
      </li>
    </ul>
  </div>
</template>

<script setup>
  defineProps({
    title: {
      type: String,
      required: true
    },
    captions: {
      type: Array
    }
  })
</script>

<style lang="scss">
  /*
  styling added because surface-card token does not support opacity
  TODO: remove this styling once the tokens are added to new theme package
  */
  .azion-dark #map-legend-block {
    background-color: rgba(#171717, 0.85);
  }

  #map-legend-block {
    background-color: rgba(#ffffff, 0.85);
  }
</style>
