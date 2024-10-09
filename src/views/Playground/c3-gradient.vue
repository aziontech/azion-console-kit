<template>
  <svg
    width="0"
    height="0"
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="linear-green"
        x1="0"
        x2="0"
        y1="0"
        y2="1"
      >
        <stop
          offset="0%"
          stop-color="#22C55E"
        />
        <stop
          offset="100%"
          stop-color="#76DB9B"
        />
      </linearGradient>
      <linearGradient
        id="linear-orange"
        x1="0"
        x2="0"
        y1="0"
        y2="1"
      >
        <stop
          offset="0%"
          stop-color="#F97316"
        />
        <stop
          offset="100%"
          stop-color="#FBA86F"
        />
      </linearGradient>
    </defs>
  </svg>
</template>
<script setup>
  defineOptions({
    name: 'C3Gradient'
  })
</script>

<style lang="scss">
  .c3-legend-item:nth-child(1) .c3-legend-item-tile {
    stroke: var(--series-one-color) !important;
  }
  .c3-legend-item:nth-child(2) .c3-legend-item-tile {
    stroke: var(--series-two-color) !important;
  }
  .c3-legend-item:nth-child(3) .c3-legend-item-tile {
    stroke: var(--series-three-color) !important;
  }
  .c3-legend-item:nth-child(4) .c3-legend-item-tile {
    stroke: var(--series-four-color) !important;
  }
  .c3-legend-item:nth-child(5) .c3-legend-item-tile {
    stroke: var(--series-five-color) !important;
  }
  .c3-legend-item:nth-child(6) .c3-legend-item-tile {
    stroke: var(--series-six-color) !important;
  }
  .c3-legend-item:nth-child(7) .c3-legend-item-tile {
    stroke: var(--series-seven-color) !important;
  }
  .c3-legend-item:nth-child(8) .c3-legend-item-tile {
    stroke: var(--series-eight-color) !important;
  }
</style>
