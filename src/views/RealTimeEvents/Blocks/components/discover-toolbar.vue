<script setup>
  import PrimeButton from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'
  import Dropdown from '@aziontech/webkit/dropdown'
  import Menu from '@aziontech/webkit/menu'
  import { eventsPlaygroundOpener } from '@/helpers'
  import { ref } from 'vue'

  defineOptions({ name: 'DiscoverToolbar' })

  const props = defineProps({
    sidebarVisible: { type: Boolean, default: true },
    recordsFound: { type: [String, Number], default: '' },
    documentSearchQuery: { type: String, default: '' },
    detailViewMode: { type: String, default: 'inline' },
    isFullscreen: { type: Boolean, default: false },
    pageSize: { type: [Number, String], default: 50 },
    pageSizeOptions: { type: Array, default: () => [] },
    exportMenuItems: { type: Array, default: () => [] }
  })

  const emit = defineEmits([
    'update:sidebarVisible',
    'update:documentSearchQuery',
    'update:isFullscreen',
    'toggle-detail-mode',
    'page-size-change',
    'open-playground'
  ])

  const exportMenuRef = ref(null)

  const toggleExport = (event) => {
    exportMenuRef.value?.toggle(event)
  }

  defineExpose({ exportMenuRef })
</script>

<template>
  <div class="flex gap-2 justify-between items-center mb-2 px-2 pt-1 flex-wrap">
    <div class="flex items-center gap-2 min-w-0">
      <PrimeButton
        :icon="sidebarVisible ? 'pi pi-angle-double-left' : 'pi pi-list'"
        :label="sidebarVisible ? '' : 'Fields'"
        text
        size="small"
        @click="emit('update:sidebarVisible', !sidebarVisible)"
        v-tooltip.top="{
          value: sidebarVisible ? 'Hide fields' : 'Show fields',
          showDelay: 200
        }"
      />
      <span
        v-if="recordsFound"
        class="ml-2 px-2 py-0.5 rounded-md text-color discover-docs-badge"
        >{{ recordsFound }} Documents found</span
      >
    </div>
    <div class="flex gap-2 items-center flex-wrap">
      <div class="relative hidden md:flex items-center">
        <i class="pi pi-search absolute left-2.5 text-sm text-color-secondary pointer-events-none" />
        <InputText
          :modelValue="documentSearchQuery"
          placeholder="Search documents..."
          class="pl-8 w-56 !h-8 text-sm !shadow-none !outline-none"
          @update:modelValue="emit('update:documentSearchQuery', $event)"
        />
        <PrimeButton
          v-if="documentSearchQuery"
          icon="pi pi-times"
          text
          rounded
          size="small"
          class="!w-5 !h-5 !p-0 absolute right-1"
          @click="emit('update:documentSearchQuery', '')"
        />
      </div>
      <PrimeButton
        icon="pi pi-chevron-down"
        size="small"
        severity="secondary"
        class="!h-8"
        :outlined="detailViewMode !== 'inline'"
        @click="detailViewMode !== 'inline' && emit('toggle-detail-mode')"
        v-tooltip.top="{ value: 'Expand inline', showDelay: 200 }"
      />
      <PrimeButton
        icon="pi pi-window-maximize"
        size="small"
        severity="secondary"
        class="hidden md:inline-flex !h-8"
        :outlined="detailViewMode !== 'sidebar'"
        @click="detailViewMode !== 'sidebar' && emit('toggle-detail-mode')"
        v-tooltip.top="{ value: 'Show in sidebar', showDelay: 200 }"
      />
      <PrimeButton
        outlined
        size="small"
        :icon="isFullscreen ? 'pi pi-arrows-alt' : 'pi pi-expand'"
        class="min-w-max !h-8"
        @click="emit('update:isFullscreen', !isFullscreen)"
        v-tooltip.left="{
          value: isFullscreen ? 'Exit fullscreen' : 'Fullscreen',
          showDelay: 200
        }"
      />
      <Dropdown
        :modelValue="pageSize"
        :options="pageSizeOptions"
        optionLabel="label"
        optionValue="value"
        @update:modelValue="emit('page-size-change', $event)"
        class="toolbar-page-size toolbar-page-size--responsive"
      />
      <PrimeButton
        outlined
        size="small"
        icon="ai ai-graphql"
        class="min-w-max hidden md:inline-flex !h-8"
        @click="eventsPlaygroundOpener"
        v-tooltip.left="{ value: 'GraphQL Playground', showDelay: 200 }"
      />
      <PrimeButton
        outlined
        size="small"
        icon="pi pi-download"
        class="min-w-max !h-8"
        @click="toggleExport"
        v-tooltip.left="{ value: 'Export data', showDelay: 200 }"
        aria-haspopup="true"
      />
      <Menu
        ref="exportMenuRef"
        :model="exportMenuItems"
        :popup="true"
      />
    </div>
  </div>
</template>

<style scoped>
  /* Toolbar: align page-size dropdown height with small buttons */
  :deep(.toolbar-page-size .p-dropdown-label) {
    padding-top: 0;
    padding-bottom: 0;
    font-size: 0.875rem;
    display: flex;
    align-items: center;
  }
  :deep(.toolbar-page-size) {
    height: 2rem;
    display: flex;
    align-items: center;
  }
  :deep(.toolbar-page-size .p-dropdown-trigger) {
    width: 2rem;
  }
  .toolbar-page-size--responsive {
    width: 7rem;
  }
  @media (max-width: 768px) {
    .toolbar-page-size--responsive {
      width: 5rem;
    }
  }

  /* Documents found badge */
  .discover-docs-badge {
    font-size: 0.8125rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  @media (max-width: 768px) {
    .discover-docs-badge {
      font-size: 0.6875rem;
      padding: 0.125rem 0.375rem;
    }
  }

  @media (max-width: 640px) {
    .discover-docs-badge {
      font-size: 0.625rem;
      max-width: 10rem;
    }
  }
</style>
