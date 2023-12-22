<script setup>
import TabMenu from 'primevue/tabmenu'
import Dropdown from 'primevue/dropdown'
import { onMounted, ref, watch } from 'vue'

const emit = defineEmits(['teste', 'change:tabs'])

const props = defineProps({
  tabsReportsMetricsService: {
    type: Function,
    required: true
  },
  dropdownReportsMetricsService: {
    type: Function,
    required: true
  },
  tabs: {
    type: Array,
    required: true
  },
})

onMounted(async () => {
  tabItems.value = props.tabsReportsMetricsService()
  dropdownItems.value = props.dropdownReportsMetricsService()


  mapDropdownItems(tabItems.value)
  selectedDropdown.value = dropdownItems.value[0].name
  setTimeout(() => {
    named(dropdownItems.value[0].code)
    active.value = 0
  }, 100);
})

const tabItems = ref([])

let dropdownItems = ref()
let active = ref()
const selectedDropdown = ref()


function mapDropdownItems(params) {

  const retornoMap = params.map((drop) => {
    return {
      name: drop.label, code: drop.id
    }
  })
  dropdownItems.value = retornoMap
}

function named(params) {
  emit('teste', params)

}

function name(params) {
  emit('change:tabs', params)
}

watch(
  active,
  async (newX) => {
    name(newX)
    console.log('watch', newX)
  }
)

</script>

<template>
  <div class="flex w-full items-end gap-3 mb-4">
    <Dropdown v-model="selectedDropdown" :options="dropdownItems" optionLabel="name" class="flex self-start"
      :placeholder="selectedDropdown" @change="named" />
    <TabMenu v-model:activeIndex="active" :model="props.tabs" @tab-change="name" :key="active" />
  </div>
</template>
