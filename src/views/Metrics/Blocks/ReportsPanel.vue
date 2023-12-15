<script setup>
import TabMenu from 'primevue/tabmenu'
import Dropdown from 'primevue/dropdown'
import { onMounted, ref } from 'vue';

const props = defineProps({
  tabsReportsMetricsService: {
    type: Function,
    required: true
  },
  dropdownReportsMetricsService: {
    type: Function,
    required: true
  }
})

onMounted(() => {
  tabItems.value = props.tabsReportsMetricsService()
  dropdownItems.value = props.dropdownReportsMetricsService()

  selectedDropdown.value = dropdownItems.value[0]
})

const tabItems = ref([]);

const dropdownItems = ref();
const selectedDropdown = ref();

</script>

<template>
  <div class="flex w-full items-end gap-3 mb-4">
    <Dropdown v-model="selectedDropdown" :options="dropdownItems" optionLabel="name" :placeholder="selectedDropdown"
      class="flex self-start" />
    <TabMenu :model="tabItems" />
  </div>
</template>
