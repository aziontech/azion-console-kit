<script setup>
  import Divider from 'primevue/divider'
  import Tag from 'primevue/tag'

  defineOptions({ name: 'info-section' })
  const props = defineProps({
    date: {
      type: String
    },
    title: {
      type: String,
      required: true
    },
    tagText: {
      type: String
    },
    tagSeverity: {
      type: String,
      default: 'info'
    }
  })

  const tagIconMap = {
    'warn': 'pi pi-exclamation-triangle',
    'danger': 'pi pi-times-circle',
  }

  defineExpose({ props })
</script>

<template>
  <div
    class="flex max-w-screen-2xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
  >
    <div class="whitespace-nowrap flex-col justify-center items-start gap-3 flex">
      <h2 class="text-color text-xl font-medium flex gap-2">
        {{ props.title }}
        <Tag
          v-if="props.tagText"
          :severity="props.tagSeverity"
          :icon="tagIconMap[props.tagSeverity]"
          class="not-italic border surface-border text-color-secondary surface-100"
          :value="props.tagText"
        />
      </h2>
      <div
        v-if="props.date"
        class="justify-start items-center gap-1 inline-flex"
      >
        <i class="pi pi-calendar text-color"></i>
        <span class="text-color-secondary">{{ props.date }}</span>
      </div>
    </div>

    <Divider />
    <slot name="body"></slot>
  </div>
</template>
