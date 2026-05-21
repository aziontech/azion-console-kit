<script setup>
  import PrimeButton from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'
  import Dropdown from '@aziontech/webkit/dropdown'
  import Menu from '@aziontech/webkit/menu'
  import { eventsPlaygroundOpener } from '@/helpers'
  import { ref } from 'vue'

  defineOptions({ name: 'DiscoverToolbar' })

  defineProps({
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
  <div class="discover-toolbar">
    <div class="discover-toolbar__left">
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
        class="discover-docs-badge"
        >{{ recordsFound }} Documents found</span
      >
    </div>
    <div class="discover-toolbar__right">
      <div class="discover-toolbar__search">
        <i class="pi pi-search discover-toolbar__search-icon" />
        <InputText
          :modelValue="documentSearchQuery"
          placeholder="Search documents..."
          class="discover-toolbar__search-input !h-8 text-sm !shadow-none !outline-none"
          @update:modelValue="emit('update:documentSearchQuery', $event)"
        />
        <PrimeButton
          v-if="documentSearchQuery"
          icon="pi pi-times"
          text
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
        class="discover-toolbar__btn-hide-sm !h-8"
        :outlined="detailViewMode !== 'sidebar'"
        @click="detailViewMode !== 'sidebar' && emit('toggle-detail-mode')"
        v-tooltip.top="{ value: 'Show in sidebar', showDelay: 200 }"
      />
      <PrimeButton
        outlined
        size="small"
        :icon="isFullscreen ? 'pi pi-arrows-alt' : 'pi pi-expand'"
        class="!h-8"
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
        class="toolbar-page-size"
      />
      <PrimeButton
        outlined
        size="small"
        icon="ai ai-graphql"
        class="discover-toolbar__btn-hide-sm !h-8"
        @click="eventsPlaygroundOpener"
        v-tooltip.left="{ value: 'GraphQL Playground', showDelay: 200 }"
      />
      <PrimeButton
        outlined
        size="small"
        icon="pi pi-download"
        class="!h-8"
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
  .discover-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    padding: 0.25rem 0.5rem;
    flex-wrap: nowrap;
    min-width: 0;
  }

  .discover-toolbar__left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
    flex-shrink: 1;
    overflow: hidden;
  }

  .discover-toolbar__right {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-shrink: 1;
    min-width: 0;
    flex-wrap: nowrap;
  }

  .discover-toolbar__search {
    position: relative;
    display: flex;
    align-items: center;
    flex: 0 1 14rem;
    min-width: 6rem;
  }

  .discover-toolbar__search-icon {
    position: absolute;
    left: 0.625rem;
    font-size: 0.75rem;
    color: var(--text-color-secondary);
    pointer-events: none;
    z-index: 1;
  }

  .discover-toolbar__search-input {
    padding-left: 2rem !important;
    width: 100%;
    max-width: 14rem;
  }

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
    width: clamp(4rem, 6vw, 7rem);
  }
  :deep(.toolbar-page-size .p-dropdown-trigger) {
    width: 2rem;
  }

  /* Documents found badge */
  .discover-docs-badge {
    font-size: 0.8125rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0.125rem 0.5rem;
    border-radius: 0.375rem;
    max-width: 20vw;
  }

  /* Hide secondary buttons at smaller widths */
  .discover-toolbar__btn-hide-sm {
    display: inline-flex;
  }

  @media (max-width: 1100px) {
    .discover-toolbar__btn-hide-sm {
      display: none;
    }

    .discover-toolbar__search {
      flex: 0 1 10rem;
    }

    .discover-toolbar__search-input {
      max-width: 10rem;
    }
  }

  @media (max-width: 900px) {
    .discover-toolbar__search {
      display: none;
    }

    .discover-docs-badge {
      max-width: 12vw;
      font-size: 0.6875rem;
    }
  }
</style>
