<template>
  <div
    id="map-legend-block"
    class="absolute bottom-3 right-3 rounded border px-4 py-3 flex flex-col gap-2 text-color"
  >
    <p class="text-sm font-medium">{{ title }}</p>
    <ul class="flex flex-col gap-1">
      <li
        v-for="caption in CAPTIONS"
        :key="caption.label"
        class="text-xs flex items-center gap-1"
      >
        <span :class="['w-2 h-2 border', caption.bullet]" />
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
    }
  })

  const CAPTIONS = [
    {
      label: `+100,000,000`,
      bullet: 'border-[#ff6259] bg-[#ff6259]'
    },
    {
      label: `100,000 - 100,000,000`,
      bullet: 'border-[#ff8780] bg-[#ff8780]'
    },
    {
      label: `10,000 - 99,999`,
      bullet: 'border-[#fa8e42] bg-[#fa8e42]'
    },
    {
      label: `1,000 - 9,999`,
      bullet: 'border-[#fba86f] bg-[#fba86f]'
    },
    {
      label: `1 - 999`,
      bullet: 'border-[#f6de95] bg-[#f6de95]'
    }
  ]
</script>

<style lang="scss">
  /*
  styling added because surface-card token does not support opacity
  TODO: remove this styling once the tokens are added to new theme package
  */
  .azion-dark #map-legend-block {
    background-color: rgba(#111111, 0.85);
    border-color: #282828;
  }

  #map-legend-block {
    background-color: rgba(#ffffff, 0.85);
    border-color: #e8e8e8;
  }
</style>
