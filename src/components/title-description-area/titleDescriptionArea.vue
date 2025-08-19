<template>
  <div class="flex flex-col gap-2">
    <TitleText :title="title" />
    <DescriptionText
      v-if="description"
      :description="description"
    />
  </div>
</template>

<script setup>
  import TitleText from '../title-text/titleText'
  import DescriptionText from '../description-text/descriptionText'

  defineProps({
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    }
  })
</script>
