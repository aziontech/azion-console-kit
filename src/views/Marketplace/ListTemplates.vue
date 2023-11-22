<template>
  <div class="ml-0 w-full mt-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
    <PrimeCard
      v-for="template in props.templates"
      :key="template.id"
      :pt="{
        root: 'p-4 flex-shrink basis-6/12',
        body: 'w-full h-full',
        content: 'h-full'
      }"
    >
      <template #content>
        <div class="flex flex-col h-full justify-between gap-3.5 items-start">
          <div class="flex gap-3.5 flex-col">
            <div
              class="w-10 h-10 rounded surface-border border flex justify-center items-center bg-white"
            >
              <img
                class="rounded"
                :src="template.vendor.icon"
                alt=""
              />
            </div>
            <div class="flex p-0.5 flex-col">
              <span class="text-color text-sm font-medium">
                {{ template.name }}
              </span>
              <span class="h-10 pb-4 text-sm text-color-secondary mt-1.5 line-clamp-2">
                {{ template.headline }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </PrimeCard>
  </div>
</template>

<script setup>
  import PrimeCard from 'primevue/card'

  const props = defineProps({
    templates: Array
  })
</script>
