<template>
  <div class="p-4 grid grid-cols-12 gap-4">
    <GraphsCardBlock
      title="Name Chart 1"
      :cols="8"
    />
    <GraphsCardBlock
      title="Name Chart 2"
      :cols="4"
    />
  </div>
</template>

<script setup>
import GraphsCardBlock from '@/templates/graphs-card-block'
</script>
