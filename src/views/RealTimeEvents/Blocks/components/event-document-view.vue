<script setup>
  import { ref, computed } from 'vue'
  import TabView from '@aziontech/webkit/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import PrimeButton from '@aziontech/webkit/button'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { clipboardWrite } from '@/helpers/clipboard'

  defineOptions({ name: 'EventDocumentView' })

  const props = defineProps({
    data: {
      type: Object,
      required: true
    },
    onAddFilter: {
      type: Function,
      default: null
    },
    onExcludeFilter: {
      type: Function,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    compact: {
      type: Boolean,
      default: false
    }
  })

  const toast = useToast()
  const activeTab = ref(0)

  const summaryEntries = computed(() => {
    if (!props.data?.summary) return []
    return Array.isArray(props.data.summary) ? props.data.summary : []
  })

  const jsonDocument = computed(() => {
    if (!summaryEntries.value.length) return '{}'
    const obj = {}
    summaryEntries.value.forEach(({ key, value }) => {
      obj[key] = value
    })
    return JSON.stringify(obj, null, 2)
  })

  const handleCopy = (value) => {
    clipboardWrite(String(value))
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'Copied to clipboard'
    })
  }

  const handleCopyJson = () => {
    clipboardWrite(jsonDocument.value)
    toast.add({
      closable: true,
      severity: 'success',
      summary: 'JSON copied to clipboard'
    })
  }

  const handleAddFilter = (key, value) => {
    if (props.onAddFilter) {
      props.onAddFilter(key, value)
    }
  }

  const handleExcludeFilter = (key, value) => {
    if (props.onExcludeFilter) {
      props.onExcludeFilter(key, value)
    }
  }

  const formatDisplayValue = (value) => {
    if (value === null || value === undefined || value === '-') return '-'
    const str = String(value)
    return str.length > 200 ? `${str.slice(0, 200)}…` : str
  }
</script>

<template>
  <div
    class="w-full surface-ground rounded-md border surface-border overflow-hidden"
    data-testid="event-document-view"
  >
    <!-- Loading skeleton -->
    <div
      v-if="isLoading"
      class="p-4"
    >
      <div class="flex flex-col gap-3">
        <div class="flex gap-2 items-center">
          <Skeleton
            width="6rem"
            height="1.5rem"
            borderRadius="4px"
          />
          <Skeleton
            width="4rem"
            height="1.5rem"
            borderRadius="4px"
          />
        </div>
        <div
          v-for="idx in 8"
          :key="idx"
          class="flex gap-4 items-center"
        >
          <Skeleton
            width="140px"
            height="1.2rem"
            borderRadius="3px"
          />
          <Skeleton
            class="flex-1"
            height="1.2rem"
            borderRadius="3px"
          />
          <Skeleton
            width="80px"
            height="1.2rem"
            borderRadius="3px"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <TabView
      v-else
      class="w-full event-document-tabs"
      v-model:activeIndex="activeTab"
    >
      <TabPanel header="Table">
        <!-- Compact mode: dense horizontal rows for inline expansion -->
        <div
          v-if="compact"
          class="doc-compact"
        >
          <div
            v-for="(entry, index) in summaryEntries"
            :key="index"
            class="doc-compact__row group"
            data-testid="event-document-row"
          >
            <span class="doc-compact__key">{{ entry.key }}</span>
            <span
              class="doc-compact__value"
              :title="String(entry.value).length > 60 ? String(entry.value) : undefined"
              >{{ formatDisplayValue(entry.value) }}</span
            >
            <span class="doc-compact__actions">
              <PrimeButton
                v-if="onAddFilter && entry.value !== '-'"
                icon="pi pi-plus-circle"
                text
                size="small"
                class="!w-5 !h-5 !p-0"
                v-tooltip.top="{ value: 'Filter for value', showDelay: 300 }"
                @click.stop="handleAddFilter(entry.key, entry.value)"
              />
              <PrimeButton
                v-if="onExcludeFilter && entry.value !== '-'"
                icon="pi pi-minus-circle"
                text
                size="small"
                class="!w-5 !h-5 !p-0"
                v-tooltip.top="{ value: 'Filter out value', showDelay: 300 }"
                @click.stop="handleExcludeFilter(entry.key, entry.value)"
              />
              <PrimeButton
                v-if="entry.value !== '-'"
                icon="pi pi-copy"
                text
                size="small"
                class="!w-5 !h-5 !p-0"
                v-tooltip.top="{ value: 'Copy value', showDelay: 300 }"
                @click.stop="handleCopy(entry.value)"
              />
            </span>
          </div>
        </div>

        <!-- Default mode: spacious layout for sidebar -->
        <div
          v-else
          class="doc-list"
        >
          <div
            v-for="(entry, index) in summaryEntries"
            :key="index"
            class="doc-list__item group"
            data-testid="event-document-row"
          >
            <div class="doc-list__header">
              <span class="doc-list__key">{{ entry.key }}</span>
              <div class="doc-list__actions opacity-0 group-hover:opacity-100 transition-opacity">
                <PrimeButton
                  v-if="onAddFilter && entry.value !== '-'"
                  icon="pi pi-plus-circle"
                  text
                  rounded
                  size="small"
                  class="!w-6 !h-6"
                  v-tooltip.top="{ value: 'Filter for value', showDelay: 300 }"
                  @click.stop="handleAddFilter(entry.key, entry.value)"
                  data-testid="event-document-add-filter"
                />
                <PrimeButton
                  v-if="onExcludeFilter && entry.value !== '-'"
                  icon="pi pi-minus-circle"
                  text
                  rounded
                  size="small"
                  class="!w-6 !h-6"
                  v-tooltip.top="{ value: 'Filter out value', showDelay: 300 }"
                  @click.stop="handleExcludeFilter(entry.key, entry.value)"
                  data-testid="event-document-exclude-filter"
                />
                <PrimeButton
                  v-if="entry.value !== '-'"
                  icon="pi pi-copy"
                  text
                  rounded
                  size="small"
                  class="!w-6 !h-6"
                  v-tooltip.top="{ value: 'Copy value', showDelay: 300 }"
                  @click.stop="handleCopy(entry.value)"
                  data-testid="event-document-copy-value"
                />
              </div>
            </div>
            <div
              class="doc-list__value"
              :title="String(entry.value).length > 100 ? String(entry.value) : undefined"
            >
              {{ formatDisplayValue(entry.value) }}
            </div>
          </div>
        </div>
      </TabPanel>
      <TabPanel header="JSON">
        <div class="relative">
          <PrimeButton
            icon="pi pi-copy"
            text
            rounded
            size="small"
            class="absolute top-2 right-2 z-10"
            v-tooltip.left="{ value: 'Copy JSON', showDelay: 300 }"
            @click="handleCopyJson"
            data-testid="event-document-copy-json"
          />
          <pre
            class="json-pre p-4 text-xs text-color surface-ground rounded-md overflow-x-auto max-h-[400px] overflow-y-auto leading-5"
            data-testid="event-document-json"
            >{{ jsonDocument }}</pre
          >
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
  :deep(.event-document-tabs .p-tabview-panels) {
    padding: 0;
  }

  :deep(.event-document-tabs .p-tabview-panel) {
    padding: 0;
  }

  :deep(.event-document-tabs .p-tabview-nav) {
    background: transparent;
  }

  :deep(.event-document-tabs .p-tabview-nav-link) {
    padding: 0.4rem 0.75rem;
    font-size: 0.75rem;
  }

  :deep(.event-document-tabs .p-tabview-nav-container) {
    margin-bottom: 0.75rem;
  }

  /* ── Document list layout ─────────────────────────────────────── */
  .doc-list {
    display: flex;
    flex-direction: column;
  }

  .doc-list__item {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
    gap: 0.2rem;
  }

  .doc-list__item:last-child {
    border-bottom: none;
  }

  .doc-list__item:hover {
    background: var(--surface-hover);
  }

  .doc-list__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    min-height: 1.5rem;
  }

  .doc-list__key {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--series-one-color, #fba86f);
    user-select: all;
    white-space: nowrap;
  }

  .doc-list__actions {
    display: flex;
    align-items: center;
    gap: 0.125rem;
    flex-shrink: 0;
  }

  .doc-list__value {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.78rem;
    line-height: 1.5;
    color: var(--text-color);
    word-break: break-word;
    overflow-wrap: break-word;
    padding-left: 0.25rem;
  }

  /* ── Compact layout (inline expansion) ─────────────────────── */
  .doc-compact {
    display: flex;
    flex-direction: column;
    max-height: 320px;
    overflow-y: auto;
  }

  .doc-compact__row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
    min-height: 1.6rem;
  }

  .doc-compact__row:last-child {
    border-bottom: none;
  }

  .doc-compact__row:hover {
    background: var(--surface-hover);
  }

  .doc-compact__key {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--series-one-color, #fba86f);
    white-space: nowrap;
    flex-shrink: 0;
    min-width: 120px;
    max-width: 160px;
  }

  .doc-compact__value {
    font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    font-size: 0.72rem;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
  }

  .doc-compact__actions {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  .doc-compact__row:hover .doc-compact__actions {
    visibility: visible;
    opacity: 1;
  }

  /* ── JSON pre block ─────────────────────────────────────────── */
  .json-pre {
    font-family:
      ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  }
</style>
