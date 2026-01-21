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
      @show="onOverlayShow"
      @hide="onOverlayHide"
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
        <TabPanel header="Quick">
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
            :isActive="activeTab === 2"
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
  import { defineModel, nextTick, ref } from 'vue'
  import OverlayPanel from 'primevue/overlaypanel'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import { createRelativeRange, COMMON_DATE_RANGES } from '@utils/date.js'

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
  const isOverlayOpen = ref(false)

  const model = defineModel({
    type: Object,
    required: false,
    default: () => {
      const now = new Date()
      const { startDate, endDate } = createRelativeRange(5, 'minutes', 'last', now)

      return {
        startDate,
        endDate,
        label: COMMON_DATE_RANGES.last_5_minutes.label,
        relative: {
          direction: 'last',
          value: 5,
          unit: 'minutes',
          preset: 'last_5_minutes'
        }
      }
    }
  })

  const openOverlay = async (payload, tabIndex) => {
    activeTab.value = tabIndex

    const event = tabIndex === 0 ? payload : payload?.event
    const field = tabIndex === 0 ? undefined : payload?.field
    if (field === 'start' || field === 'end') editingField.value = field

    if (!event) return

    if (isOverlayOpen.value) {
      overlayPanel.value?.hide?.()
      await nextTick()
      overlayPanel.value?.show?.(event)
      return
    }

    overlayPanel.value?.show?.(event)
  }

  const closeOverlay = () => {
    overlayPanel.value?.hide?.()
  }

  const onOverlayShow = () => {
    isOverlayOpen.value = true
  }

  const onOverlayHide = () => {
    isOverlayOpen.value = false
  }
</script>
