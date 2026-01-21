<template>
  <div class="p-inputgroup w-fit">
    <QuickSelect
      v-model="model"
      :maxDays="maxDays"
      @select="emit('select', $event)"
      @open="openOverlay($event, 0)"
    />
    <InputDateRange
      v-model="model"
      :maxDays="maxDays"
      @select="emit('select', $event)"
      @open="openOverlay($event, 1)"
    />

    <OverlayPanel
      ref="overlayPanel"
      class="min-w-[200px] max-w-[430px]"
      :showCloseIcon="false"
      :pt="{
        content: { class: 'p-2' }
      }"
    >
      <TabView
        v-model:activeIndex="activeTab"
        :pt="{
          navcontent: { class: 'mb-2 pb-1' }
        }"
      >
        <TabPanel header="Quick Select">
          <QuickSelect
            panelOnly
            v-model="model"
            :maxDays="maxDays"
            @select="emit('select', $event)"
            @close="closeOverlay"
          />
        </TabPanel>
        <TabPanel header="Absolute">
          <InputDateRange
            panelOnly
            mode="absolute"
            :editingField="editingField"
            v-model="model"
            :maxDays="maxDays"
            @select="emit('select', $event)"
            @close="closeOverlay"
          />
        </TabPanel>
        <TabPanel header="Relative">
          <InputDateRange
            panelOnly
            mode="relative"
            :editingField="editingField"
            v-model="model"
            :maxDays="maxDays"
            @select="emit('select', $event)"
            @close="closeOverlay"
          />
        </TabPanel>
      </TabView>
    </OverlayPanel>
  </div>
</template>

<script setup>
  import QuickSelect from './quickSelect/index.vue'
  import InputDateRange from './inputDateRange/index.vue'
  import { defineModel, ref } from 'vue'
  import OverlayPanel from 'primevue/overlaypanel'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'

  defineOptions({ name: 'DataTimeRange', inheritAttrs: true })

  defineProps({
    maxDays: {
      type: Number
    }
  })

  const emit = defineEmits(['select'])

  const overlayPanel = ref(null)
  const activeTab = ref(0)
  const editingField = ref('start')

  const model = defineModel({
    type: Object,
    required: false,
    default: () => ({
      startDate: new Date(),
      endDate: new Date(),
      label: ''
    })
  })

  const openOverlay = (payload, tabIndex) => {
    activeTab.value = tabIndex
    if (tabIndex === 0) {
      overlayPanel.value?.toggle?.(payload)
      return
    }

    const { event, field } = payload || {}
    if (field === 'start' || field === 'end') {
      editingField.value = field
    }
    overlayPanel.value?.toggle?.(event)
  }

  const closeOverlay = () => {
    overlayPanel.value?.hide?.()
  }
</script>
