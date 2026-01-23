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
            v-if="activeTab === 2"
            panelOnly
            mode="relative"
            :editingField="editingField"
            v-model="model"
            :maxDays="maxDays"
            @select="emit('select', $event)"
            @close="closeOverlay"
          />
        </TabPanel>
        <TabPanel header="Now">
          <div class="flex flex-col gap-4 max-w-[300px] px-4 mb-2">
            <div class="text-sm text-color-secondary">
              Selecting 'Set Now' sets the time dynamically to the exact moment of each refresh.
            </div>
            <PrimeButton
              label="Set Now"
              severity="secondary"
              size="small"
              @click="setNow"
            />
          </div>
        </TabPanel>
      </TabView>
    </OverlayPanel>
  </div>
</template>

<script setup>
  import { defineModel, nextTick, ref } from 'vue'
  import QuickSelect from './quickSelect/index.vue'
  import InputDateRange from './inputDateRange/index.vue'
  import PrimeButton from 'primevue/button'
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
        labelStart: COMMON_DATE_RANGES.last_5_minutes.label,
        labelEnd: COMMON_DATE_RANGES.last_5_minutes.label,
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

  const setNow = () => {
    const now = new Date()
    model.value.label = ''

    if (editingField.value === 'start') {
      model.value.startDate = now
      model.value.labelStart = 'now'
    } else {
      model.value.endDate = now
      model.value.labelEnd = 'now'
    }

    emit('select', model.value)
    closeOverlay()
  }
</script>
