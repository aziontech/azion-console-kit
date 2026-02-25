<template>
  <div class="p-inputgroup w-fit">
    <QuickSelect
      v-model="model"
      :maxDays="maxDays"
      @select="emit('select', $event)"
      @autoRefresh="emit('autoRefresh', $event)"
      @open="openOverlay($event, 0)"
    />
    <InputDateRange
      v-model="model"
      :maxDays="maxDays"
      :editingField="editingField"
      :isOverlayOpen="isOverlayOpen"
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
      <div class="relative">
        <div
          v-if="activeTab === 0"
          class="absolute right-0 top-0 z-10 flex items-center gap-1"
        >
          <PrimeButton
            icon="pi pi-chevron-left"
            size="small"
            outlined
            @click="shiftQuick(-1)"
          />
          <PrimeButton
            icon="pi pi-chevron-right"
            size="small"
            outlined
            @click="shiftQuick(1)"
          />
        </div>
        <TabView
          v-model:activeIndex="activeTab"
          :pt="{
            navcontent: { class: ['mb-2 pb-1', activeTab === 0 ? 'pr-16' : ''] }
          }"
        >
          <TabPanel header="Quick">
            <QuickSelect
              panelOnly
              v-model="model"
              :maxDays="maxDays"
              @select="emit('select', $event)"
              @autoRefresh="emit('autoRefresh', $event)"
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

        <div
          class="flex items-center gap-2 mb-2 pt-4 mt-4 justify-between border-t border-[var(--surface-border)]"
          :class="{
            'px-4 mt-1': activeTab === 3
          }"
        >
          <div class="text-xs text-color-secondary">
            UTC:
            <span class="text-color font-medium">{{ userTimezone }}</span>
          </div>
          <Dropdown
            v-model="model.utcOffset"
            :options="utcOffsetOptions"
            optionLabel="label"
            optionValue="value"
            filter
            filterPlaceholder="Search timezone"
            class="w-auto"
            :pt="{ input: { class: 'text-xs' } }"
          />
        </div>
      </div>
    </OverlayPanel>
  </div>
</template>

<script setup>
  import { computed, defineModel, nextTick, onMounted, ref, watch } from 'vue'
  import QuickSelect from './quickSelect/index.vue'
  import InputDateRange from './inputDateRange/index.vue'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import OverlayPanel from 'primevue/overlaypanel'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import { createRelativeRange, COMMON_DATE_RANGES } from '@utils/date.js'
  import { shiftQuickRange } from './utils/quick-range-navigation'
  import { convertUtcNumberToOffset } from './utils/timezone-helpers'

  defineOptions({ name: 'DataTimeRange', inheritAttrs: true })

  const props = defineProps({
    maxDays: {
      type: Number
    },
    defaultUtcOffset: {
      type: String,
      default: '+0000'
    },
    userTimezone: {
      type: String,
      default: '+0000'
    },
    listTimezonesService: {
      type: Function,
      required: true
    }
  })

  const emit = defineEmits(['select', 'autoRefresh'])

  const overlayPanel = ref(null)
  const activeTab = ref(0)
  const editingField = ref('start')
  const isOverlayOpen = ref(false)
  const hasInitializedUtcOffset = ref(false)
  const timezoneOptions = ref([])
  const isLoadingTimezones = ref(false)

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

  const utcOffsetOptions = computed(() => {
    const accountOption = {
      label: `Account (${formatUtcOffsetLabel(props.defaultUtcOffset)})`,
      value: props.defaultUtcOffset
    }

    if (!timezoneOptions.value.length) {
      return [accountOption]
    }

    const apiOptions = timezoneOptions.value.map((tz) => ({
      label: tz.label,
      value: convertUtcNumberToOffset(tz.utc)
    }))

    return [accountOption, ...apiOptions]
  })

  const fetchTimezones = async () => {
    isLoadingTimezones.value = true
    try {
      const result = await props.listTimezonesService()
      timezoneOptions.value = result.listTimeZones
    } finally {
      isLoadingTimezones.value = false
    }
  }

  watch(
    () => model.value?.utcOffset,
    () => {
      if (!hasInitializedUtcOffset.value) return
      emit('select', model.value)
    }
  )

  const formatUtcOffsetLabel = (offset) => {
    const normalized = typeof offset === 'string' ? offset.trim() : ''
    const match = normalized.match(/^([+-])(\d{2})(\d{2})$/)
    if (!match) return 'UTC'
    return `UTC${match[1]}${match[2]}:${match[3]}`
  }

  const openOverlay = async (payload) => {
    activeTab.value = 0
    const event = payload?.event ?? payload
    const field = payload?.field
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

  const shiftQuick = (stepDirection) => {
    const result = shiftQuickRange(model.value, stepDirection > 0 ? 'next' : 'prev')
    if (!result) return

    model.value.startDate = result.startDate
    model.value.endDate = result.endDate

    emit('select', model.value)
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

  onMounted(async () => {
    if (!model.value?.utcOffset) {
      model.value.utcOffset = props.defaultUtcOffset
    }
    hasInitializedUtcOffset.value = true
    await fetchTimezones()
  })
</script>
