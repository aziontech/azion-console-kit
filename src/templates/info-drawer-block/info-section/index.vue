<script setup>
  import Divider from 'primevue/divider'
  import PrimeTag from 'primevue/tag'
  import Skeleton from 'primevue/skeleton'

  defineOptions({ name: 'info-section' })
  const props = defineProps({
    hideDivider: {
      type: Boolean
    },
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
    loading: {
      type: Boolean
    }
  })

  defineExpose({ props })
</script>

<template>
  <div
    class="flex max-w-screen-3xl mx-auto gap-4 w-full surface-section rounded-md border surface-border p-3 sm:p-8 flex-wrap min-w-[2rem]"
  >
    <div
      v-if="!loading && props.title"
      class="whitespace-nowrap flex-col justify-center items-start gap-3 flex"
    >
      <div
        class="flex flex-wrap gap-2"
        v-if="props.title"
      >
        <h2 class="whitespace-normal text-color text-xl font-medium">
          {{ props.title }}
        </h2>
        <PrimeTag
          v-for="(tags, i) in props.tags"
          :key="i"
          :severity="tags?.severity ?? 'info'"
          class="cursor-pointer"
          :icon="tags?.icon"
          :value="tags.text"
        />
      </div>
      <div
        v-if="props.date"
        class="justify-start items-center gap-1 inline-flex"
      >
        <i class="pi pi-calendar text-color text-sm"></i>
        <span class="text-color-secondary text-sm">{{ props.date }}</span>
      </div>
    </div>

    <Skeleton
      v-else-if="loading"
      class="w-full h-12 mt-7"
    />

    <Divider v-if="!loading && !props.hideDivider" />
    <slot name="body"></slot>
  </div>
</template>
