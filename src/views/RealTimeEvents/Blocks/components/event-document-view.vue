<script setup>
  import { ref, computed, watch, nextTick } from 'vue'
  import TabView from '@aziontech/webkit/tabview'
  import TabPanel from '@aziontech/webkit/tabpanel'
  import PrimeButton from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { clipboardWrite } from '@/helpers/clipboard'
  import { useClickToFilter } from '../../composables/useClickToFilter.js'

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
    },
    growJsonToFit: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['notify', 'reset-scroll'])
  const activeTab = ref(0)
  const fieldSearch = ref('')

  watch(activeTab, () => {
    fieldSearch.value = ''
    nextTick(() => emit('reset-scroll'))
  })

  // Reset search whenever the document changes
  watch(
    () => props.data?.id,
    () => {
      fieldSearch.value = ''
    }
  )

  const summaryEntries = computed(() => {
    if (!props.data?.summary) return []
    return Array.isArray(props.data.summary) ? props.data.summary : []
  })

  const filteredEntries = computed(() => {
    const q = fieldSearch.value.trim().toLowerCase()
    if (!q) return summaryEntries.value
    return summaryEntries.value.filter(
      (e) =>
        String(e.key ?? '')
          .toLowerCase()
          .includes(q) ||
        String(e.value ?? '')
          .toLowerCase()
          .includes(q)
    )
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
    emit('notify', {
      closable: true,
      severity: 'success',
      summary: 'Copied to clipboard'
    })
  }

  const handleCopyJson = () => {
    clipboardWrite(jsonDocument.value)
    emit('notify', {
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
    if (value === null || value === undefined) return '-'
    const str = String(value)
    if (str === '' || str === 'null' || str === 'undefined') return '-'
    return str
  }

  const isValidValue = (value) => {
    if (value === null || value === undefined) return false
    const str = String(value)
    return str !== '' && str !== '-' && str !== 'null' && str !== 'undefined'
  }

  const { onValueMouseDown, onValueMouseUp, onValueClick } = useClickToFilter({
    onAdd: (key, value) => handleAddFilter(key, value),
    onExclude: (key, value) => handleExcludeFilter(key, value)
  })

  const clearSearch = () => {
    fieldSearch.value = ''
  }
</script>

<template>
  <div
    class="event-document-view w-full"
    data-testid="event-document-view"
  >
    <!-- Loading skeleton -->
    <div
      v-if="isLoading"
      class="p-3"
    >
      <div class="flex flex-col gap-2">
        <Skeleton
          width="100%"
          height="1.75rem"
          borderRadius="4px"
        />
        <div
          v-for="idx in 8"
          :key="idx"
          class="flex gap-4 items-center"
        >
          <Skeleton
            width="140px"
            height="1.1rem"
            borderRadius="3px"
          />
          <Skeleton
            class="flex-1"
            height="1.1rem"
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
        <!-- Search bar (keys and values) -->
        <div
          class="doc-search"
          @click.stop
          @mousedown.stop
        >
          <div class="doc-search__field p-input-icon-left p-input-icon-right">
            <i class="pi pi-search" />
            <InputText
              v-model="fieldSearch"
              placeholder="Search fields or values"
              class="w-full"
              data-testid="event-document-search"
              @click.stop
              @mousedown.stop
              @keydown.stop
            />
            <i
              v-if="fieldSearch"
              class="pi pi-times doc-search__clear"
              role="button"
              tabindex="0"
              aria-label="Clear search"
              @click.stop="clearSearch"
              @keydown.enter.prevent.stop="clearSearch"
            />
          </div>
          <span
            v-if="fieldSearch"
            class="doc-search__count"
            data-testid="event-document-search-count"
          >
            {{ filteredEntries.length }}/{{ summaryEntries.length }}
          </span>
        </div>

        <!-- Empty search state -->
        <div
          v-if="fieldSearch && filteredEntries.length === 0"
          class="doc-empty"
          data-testid="event-document-empty"
        >
          <i class="pi pi-search" />
          <span>No fields match "{{ fieldSearch }}"</span>
        </div>

        <!-- Compact mode: dense rows for inline expansion -->
        <div
          v-else-if="compact"
          class="doc-compact-wrap"
        >
          <div
            class="doc-compact"
            data-testid="event-document-compact"
          >
            <div
              v-for="(entry, index) in filteredEntries"
              :key="index"
              class="doc-compact__row group"
              data-testid="event-document-row"
            >
              <span
                class="doc-compact__key"
                :title="entry.key"
                >{{ entry.key }}</span
              >
              <span
                class="doc-compact__value"
                :title="String(entry.value).length > 100 ? String(entry.value) : undefined"
                @mousedown="onValueMouseDown"
                @mouseup="onValueMouseUp"
                @click.stop="(e) => onValueClick(e, entry.key, entry.value)"
                >{{ formatDisplayValue(entry.value) }}<span class="doc-compact__actions">
                  <PrimeButton
                    v-if="onAddFilter && isValidValue(entry.value)"
                    icon="pi pi-plus-circle"
                    text
                    size="small"
                    class="!w-5 !h-5 !p-0"
                    v-tooltip.top="{ value: 'Filter for value', showDelay: 300 }"
                    @click.stop="handleAddFilter(entry.key, entry.value)"
                    data-testid="event-document-add-filter"
                  />
                  <PrimeButton
                    v-if="onExcludeFilter && isValidValue(entry.value)"
                    icon="pi pi-minus-circle"
                    text
                    size="small"
                    class="!w-5 !h-5 !p-0"
                    v-tooltip.top="{ value: 'Filter out value', showDelay: 300 }"
                    @click.stop="handleExcludeFilter(entry.key, entry.value)"
                    data-testid="event-document-exclude-filter"
                  />
                  <PrimeButton
                    v-if="isValidValue(entry.value)"
                    icon="pi pi-copy"
                    text
                    size="small"
                    class="!w-5 !h-5 !p-0"
                    v-tooltip.top="{ value: 'Copy value', showDelay: 300 }"
                    @click.stop="handleCopy(entry.value)"
                  />
                </span></span
              >
            </div>
          </div>
          <div class="doc-compact__footer" data-testid="event-document-compact-footer">
            <span>{{ filteredEntries.length }} of {{ summaryEntries.length }} fields</span>
            <span
              v-if="filteredEntries.length < summaryEntries.length"
              class="doc-compact__footer-hint"
            >
              · scroll to see more
            </span>
          </div>
        </div>

        <!-- Default mode: spacious layout for sidebar -->
        <div
          v-else
          class="doc-list"
        >
          <div
            v-for="(entry, index) in filteredEntries"
            :key="index"
            class="doc-list__item group"
            data-testid="event-document-row"
          >
            <div class="doc-list__header">
              <span class="doc-list__key">{{ entry.key }}</span>
            </div>
            <div
              class="doc-list__value"
              :title="String(entry.value).length > 100 ? String(entry.value) : undefined"
              @mousedown="onValueMouseDown"
              @mouseup="onValueMouseUp"
              @click.stop="(e) => onValueClick(e, entry.key, entry.value)"
            >
              <span class="doc-list__value-text">{{ formatDisplayValue(entry.value) }}</span>
              <div class="doc-list__actions">
                <PrimeButton
                  v-if="onAddFilter && isValidValue(entry.value)"
                  icon="pi pi-plus-circle"
                  text
                  size="small"
                  class="!w-5 !h-5 !p-0"
                  v-tooltip.top="{ value: 'Filter for value', showDelay: 300 }"
                  @click.stop="handleAddFilter(entry.key, entry.value)"
                  data-testid="event-document-add-filter"
                />
                <PrimeButton
                  v-if="onExcludeFilter && isValidValue(entry.value)"
                  icon="pi pi-minus-circle"
                  text
                  size="small"
                  class="!w-5 !h-5 !p-0"
                  v-tooltip.top="{ value: 'Filter out value', showDelay: 300 }"
                  @click.stop="handleExcludeFilter(entry.key, entry.value)"
                  data-testid="event-document-exclude-filter"
                />
                <PrimeButton
                  v-if="isValidValue(entry.value)"
                  icon="pi pi-copy"
                  text
                  size="small"
                  class="!w-5 !h-5 !p-0"
                  v-tooltip.top="{ value: 'Copy value', showDelay: 300 }"
                  @click.stop="handleCopy(entry.value)"
                  data-testid="event-document-copy-value"
                />
              </div>
            </div>
          </div>
        </div>
      </TabPanel>
      <TabPanel header="JSON">
        <div class="relative">
          <PrimeButton
            icon="pi pi-copy"
            text
            size="small"
            class="absolute top-2 right-2 z-10"
            v-tooltip.left="{ value: 'Copy JSON', showDelay: 300 }"
            @click="handleCopyJson"
            data-testid="event-document-copy-json"
          />
          <pre
            class="json-pre p-4 text-xs text-color surface-ground rounded-md overflow-x-auto leading-5"
            :class="compact ? 'json-pre--compact' : (growJsonToFit ? 'json-pre--expanded' : 'json-pre--compact')"
            data-testid="event-document-json"
            >{{ jsonDocument }}</pre
          >
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<style scoped>
  .event-document-view {
    --rte-font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;
    border: 1px solid var(--surface-border);
    border-radius: var(--border-radius);
    overflow: hidden;
    background: var(--surface-card);
    margin-bottom: 0;
  }

  :deep(.event-document-tabs .p-tabview-panels) {
    padding: 0;
  }

  :deep(.event-document-tabs .p-tabview-panel) {
    padding: 0;
  }

  :deep(.event-document-tabs .p-tabview-nav-link) {
    padding: 0.375rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 500;
  }

  :deep(.event-document-tabs .p-tabview-nav-container) {
    margin-bottom: 0;
    border-bottom: 1px solid var(--surface-border);
  }

  /* ── Search bar ──────────────────────────────────────────────── */
  .doc-search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.5rem;
    border-bottom: 1px solid var(--surface-border);
    background: var(--surface-card);
    margin-top: 0;
  }

  .doc-search__field {
    width: 100%;
    flex: 1;
    min-width: 0;
  }

  .doc-search__field :deep(.p-inputtext) {
    width: 100%;
    height: 1.75rem;
    font-size: 0.75rem;
    padding-top: 0;
    padding-bottom: 0;
    padding-left: 1.75rem;
    padding-right: 1.75rem;
    line-height: 1.75rem;
  }

  .doc-search__field i.pi-search {
    color: var(--text-color-secondary);
    pointer-events: none;
  }

  .doc-search__clear {
    cursor: pointer;
    color: var(--text-color-secondary);
    transition: color 0.15s;
    pointer-events: auto;
  }

  .doc-search__clear:hover {
    color: var(--text-color);
  }

  .doc-search__count {
    font-family: var(--rte-font-mono);
    font-size: 0.7rem;
    color: var(--text-color-secondary);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .doc-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1.5rem 0.75rem;
    color: var(--text-color-secondary);
    font-size: 0.75rem;
  }

  .doc-empty i {
    font-size: 1.25rem;
    opacity: 0.5;
  }

  /* ── Document list layout (sidebar) — Kibana Discover style ─── */
  .doc-list {
    display: flex;
    flex-direction: column;
  }

  .doc-list__item {
    display: grid;
    grid-template-columns: minmax(120px, 160px) 1fr;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
    transition: background 0.1s;
    align-items: start;
    position: relative;
  }

  .doc-list__item:last-child {
    border-bottom: none;
  }

  .doc-list__item:hover {
    background: var(--surface-hover);
  }

  .doc-list__header {
    display: flex;
    align-items: flex-start;
    min-width: 0;
    padding-top: 2px;
  }

  .doc-list__key {
    font-family: var(--rte-font-mono);
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--series-one-color, #fba86f);
    user-select: all;
    overflow-wrap: anywhere;
    word-break: break-word;
    letter-spacing: 0.01em;
    line-height: 1.4;
  }

  .doc-list__value {
    font-family: var(--rte-font-mono);
    font-size: 0.75rem;
    line-height: 1.5;
    color: var(--text-color);
    min-width: 0;
    display: flex;
    align-items: flex-start;
    padding-right: 4rem; /* Reserve space for absolute-positioned actions */
  }

  .doc-list__value-text {
    overflow-wrap: anywhere;
    word-break: break-word;
    white-space: pre-wrap;
    user-select: text;
    cursor: text;
    flex: 1;
    min-width: 0;
  }

  .doc-list__actions {
    position: absolute;
    right: 0.375rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.1s ease;
    background: var(--surface-card);
    border: 1px solid var(--surface-border);
    padding: 2px 3px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    z-index: 2;
  }

  .doc-list__item:hover .doc-list__actions {
    opacity: 1;
    pointer-events: auto;
  }

  /* ── Compact layout (inline expansion) ──────────────────────── */
  .doc-compact-wrap {
    display: flex;
    flex-direction: column;
  }

  .doc-compact {
    display: grid;
    grid-template-columns: minmax(120px, 180px) 1fr;
    align-content: start;
    max-height: min(420px, 55vh);
    overflow-y: auto;
  }

  .doc-compact__row {
    display: contents;
  }

  .doc-compact__row > .doc-compact__key,
  .doc-compact__row > .doc-compact__value {
    padding: 0.35rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
    transition: background 0.1s;
    height: 1.75rem;
    display: flex;
    align-items: center;
  }

  .doc-compact__row:last-child > .doc-compact__key,
  .doc-compact__row:last-child > .doc-compact__value {
    border-bottom: none;
  }

  .doc-compact__row:hover > .doc-compact__key,
  .doc-compact__row:hover > .doc-compact__value {
    background: var(--surface-hover);
  }

  .doc-compact__key {
    font-family: var(--rte-font-mono);
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--series-one-color, #fba86f);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }

  .doc-compact__value {
    font-family: var(--rte-font-mono);
    font-size: 0.72rem;
    line-height: 1.4;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
    user-select: text;
    cursor: text;
    position: relative;
  }

  .doc-compact__value:hover {
    text-decoration: underline;
    text-decoration-style: dotted;
    text-underline-offset: 2px;
  }

  .doc-compact__actions {
    position: absolute;
    right: 0.5rem;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    align-items: center;
    gap: 2px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.1s ease;
    background: var(--surface-hover);
    padding: 0 2px;
    border-radius: 3px;
  }

  .doc-compact__row:hover .doc-compact__actions {
    opacity: 1;
    pointer-events: auto;
  }

  .doc-compact__footer {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.25rem;
    padding: 0.35rem 0.75rem;
    font-family: var(--rte-font-mono);
    font-size: 0.65rem;
    color: var(--text-color-secondary);
    border-top: 1px solid var(--surface-border);
    background: var(--surface-card);
    letter-spacing: 0.02em;
  }

  .doc-compact__footer-hint {
    opacity: 0.8;
    font-style: italic;
  }

  /* ── JSON pre block ─────────────────────────────────────────── */
  .json-pre {
    font-family: var(--rte-font-mono);
  }

  .json-pre--compact {
    max-height: min(560px, 60vh);
    overflow-y: auto;
  }

  .json-pre--expanded {
    max-height: none;
  }
</style>
