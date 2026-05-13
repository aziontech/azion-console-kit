<template>
  <div class="flex flex-col gap-3">
    <p
      v-if="title"
      class="font-protomono text-[11px] uppercase tracking-[0.08em] text-color-secondary"
    >
      {{ title }}
    </p>

    <div class="flex flex-col gap-3">
      <div
        v-for="(feature, index) in features"
        :key="index"
        class="flex items-start gap-2.5"
      >
        <i class="pi pi-check mt-1 text-[12px] text-green-500" />
        <div class="flex flex-col">
          <span class="text-xs leading-5 text-default">{{ feature.title }}</span>
          <span
            v-if="feature.description"
            class="text-xs leading-5 text-color-secondary"
          >
            {{ feature.description }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  defineOptions({ name: 'features-list' })

  defineProps({
    title: { type: String, default: '' },
    features: { type: Array, required: true }
  })
</script>
