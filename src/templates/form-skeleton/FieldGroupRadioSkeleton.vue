<script setup>
  import Skeleton from 'primevue/skeleton'

  defineOptions({ name: 'field-group-radio-skeleton' })

  defineProps({
    /**
     * Width of the label skeleton
     */
    labelWidth: {
      type: String,
      default: '4rem'
    },
    /**
     * Number of radio card options to show
     */
    optionCount: {
      type: Number,
      default: 2
    }
  })
</script>

<template>
  <div class="flex flex-col gap-4">
    <Skeleton
      :width="labelWidth"
      height="1rem"
      class="mb-1"
    />
    <div
      v-for="i in optionCount"
      :key="i"
      class="surface-border border-round p-4"
      style="border: 1px solid var(--surface-border)"
    >
      <div class="flex items-center gap-3">
        <Skeleton
          width="1.25rem"
          height="1.25rem"
          borderRadius="50%"
        />
        <div class="flex flex-col gap-2 flex-1">
          <Skeleton
            width="12rem"
            height="1.125rem"
          />
          <Skeleton
            width="85%"
            height="0.875rem"
          />
        </div>
      </div>
    </div>
  </div>
</template>
