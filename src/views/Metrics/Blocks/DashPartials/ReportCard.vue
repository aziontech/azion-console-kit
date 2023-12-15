<template>
  <GraphsCard
    chartOwner="azion"
    title="Four Columns Card"
    description="This card is 4 columns wide, sets the aggregation type to 'Average', the variation type to 'positive', and the variation value to '10.2%'."
    :cols="4"
    aggregationType="Average"
    variationType="positive"
    variationValue="10.2%"
  >
    <template #chart>
      <div class="surface-border border border-dashed flex items-center h-full">
        <p class="text-color-secondary text-center w-full">Slot</p>
      </div>
    </template>
  </GraphsCard>
</template>

<script setup>
  import GraphsCard from '@/templates/graphs-card-block'

  // const props = defineProps({})
</script>
