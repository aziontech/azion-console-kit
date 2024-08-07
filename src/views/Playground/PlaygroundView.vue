<template>
  <div class="w-full h-full grid grid-cols-2 gap-4 p-8">
    <template
      v-for="value in content"
      :key="value.title"
    >
      <Card class="p-4">
        <template #title>
          {{ value.title }}
        </template>
        <template #content>
          <component :is="value.component" />
        </template>
      </Card>
    </template>
  </div>
</template>

<script setup>
  import { defineAsyncComponent } from 'vue'
  import Card from 'primevue/card'

  const content = {
    granularity: {
      component: defineAsyncComponent(() => import('./maps/GranularityByCountry.vue')),
      title: 'Granularity By Country'
    }
  }
</script>
./maps/GranularityByCountry.vue
