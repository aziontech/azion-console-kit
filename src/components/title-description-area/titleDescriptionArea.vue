<template>
  <div class="flex flex-col gap-2">
    <TitleArea :title="title"/>
    <DescriptionArea
      v-if="description"
      :description="description"
    />
  </div>
</template>

<script setup>
  import TitleArea from '../title-area/titleArea'
  import DescriptionArea from '../description-area/descriptionArea'

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
  