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
    tags: {
      type: Array,
      default: () => [],
      validator: (tags) => {
        return tags.every((tag) => typeof tag === 'object' && tag !== null)
      }
    },
    tagText: {
      type: String
    },
    tagIcon: {
      type: String
    },
    tagSeverity: {
      type: String,
      default: 'info'
    }
  })

  defineExpose({ props })
</script>

<template>
  <div
    class="flex max-w-screen-2xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
  >
    <div class="whitespace-nowrap flex-col justify-center items-start gap-3 flex">
      <h2 class="text-color text-xl font-medium flex flex-wrap gap-2">
        {{ props.title }}
        <Tag
          v-for="(tags, i) in props.tags"
          :key="i"
          :severity="tags?.severity ?? 'info'"
          class="not-italic border surface-border text-color-secondary surface-100"
          :icon="tags?.icon"
          :value="tags.text"
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
