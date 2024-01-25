<script setup>
  import Dropdown from 'primevue/dropdown'
  import TabMenu from 'primevue/tabmenu'
  import { ref } from 'vue'

  const selectedGroup = ref(null)

  const metricsProducts = ref([])
  const productIdx = ref(null)
  const metricsGroups = ref([])
</script>
<template>
  <div class="flex w-full items-end gap-3 mb-4">
    <Dropdown
      v-model="selectedGroup"
      :options="metricsGroups"
      :loading="!metricsGroups.length"
      optionLabel="label"
      class="flex self-start"
    />
    <TabMenu
      v-model:activeIndex="productIdx"
      :model="metricsProducts"
      :key="productIdx"
      :pt="{ action: { class: 'w-max' } }"
    />
  </div>
</template>
