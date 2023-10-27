<template>
  <div class="p-4 grid grid-cols-12 gap-4">
    <GraphsCardBlock
      chartOwner="azion"
      title="Positive Variation"
      description="Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui. Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt eget. Sed id lorem nunc. Lorem ipsum dolor sit amet, consectetur a."
      :cols="4"
      aggregationType="Sum"
      displayTag
      variationType="positive"
      variationValue="1.25%"
    >
      <template #chart>
        <div class="surface-border border border-dashed flex items-center h-full">
          <p class="text-color-secondary text-center w-full">Slot</p>
        </div>
      </template>
    </GraphsCardBlock>
    <GraphsCardBlock
      chartOwner="user"
      title="Negative Variation"
      description="Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui. Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt eget. Sed id lorem nunc. Lorem ipsum dolor sit amet, consectetur a."
      :cols="4"
      aggregationType="Average"
      displayTag
      variationType="negative"
      variationValue="-1.25%"
    >
      <template #chart>
        <div class="surface-border border border-dashed flex items-center h-full">
          <p class="text-color-secondary text-center w-full">Slot</p>
        </div>
      </template>
    </GraphsCardBlock>
    <GraphsCardBlock
      chartOwner="account"
      title="No Variation Tag"
      description="Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui. Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt eget. Sed id lorem nunc. Lorem ipsum dolor sit amet, consectetur a."
      :cols="4"
      aggregationType="Sum"
      :displayTag="false"
    >
      <template #chart>
        <div class="surface-border border border-dashed flex items-center h-full">
          <p class="text-color-secondary text-center w-full">Slot</p>
        </div>
      </template>
    </GraphsCardBlock>
    <GraphsCardBlock
      chartOwner="user"
      title="Negative Variation Inverse"
      description="Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui. Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt eget. Sed id lorem nunc. Lorem ipsum dolor sit amet, consectetur a."
      :cols="4"
      aggregationType="Average"
      displayTag
      variationType="negative-inverse"
      variationValue="-1.25%"
    >
      <template #chart>
        <div class="surface-border border border-dashed flex items-center h-full">
          <p class="text-color-secondary text-center w-full">Slot</p>
        </div>
      </template>
    </GraphsCardBlock>
    <GraphsCardBlock
      chartOwner="azion"
      title="Positive Variation Inverse"
      description="Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui. Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt eget. Sed id lorem nunc. Lorem ipsum dolor sit amet, consectetur a."
      :cols="4"
      aggregationType="Average"
      displayTag
      variationType="positive-inverse"
      variationValue="-1.25%"
    >
      <template #chart>
        <div class="surface-border border border-dashed flex items-center h-full">
          <p class="text-color-secondary text-center w-full">Slot</p>
        </div>
      </template>
    </GraphsCardBlock>
    <GraphsCardBlock
      chartOwner="account"
      title="Loading Variation"
      description="Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui. Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt eget. Sed id lorem nunc. Lorem ipsum dolor sit amet, consectetur a."
      :cols="4"
      aggregationType="Sum"
      displayTag
      variationType="positive-inverse"
      variationValue=""
    >
      <template #chart>
        <div class="surface-border border border-dashed flex items-center h-full">
          <p class="text-color-secondary text-center w-full">Slot</p>
        </div>
      </template>
    </GraphsCardBlock>
    <GraphsCardBlock
      chartOwner="azion"
      title="No variation"
      description="Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui. Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt eget. Sed id lorem nunc. Lorem ipsum dolor sit amet, consectetur a."
      :cols="4"
      aggregationType="Average"
      displayTag
      variationType="none"
      variationValue="--%"
    >
      <template #chart>
        <div class="surface-border border border-dashed flex items-center h-full">
          <p class="text-color-secondary text-center w-full">Slot</p>
        </div>
      </template>
    </GraphsCardBlock>
    <GraphsCardBlock
      chartOwner="account"
      title="Eight columns"
      description="Description. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam in consectetur dui. Quisque vitae molestie purus. Ut fringilla pulvinar dui, non blandit nulla tincidunt eget. Sed id lorem nunc. Lorem ipsum dolor sit amet, consectetur a."
      :cols="8"
      aggregationType="Average"
      displayTag
      variationType="none"
      variationValue="--%"
    >
      <template #chart>
        <div class="surface-border border border-dashed flex items-center h-full">
          <p class="text-color-secondary text-center w-full">Slot</p>
        </div>
      </template>
    </GraphsCardBlock>
  </div>
</template>

<script setup>
import GraphsCardBlock from '@/templates/graphs-card-block'
</script>
