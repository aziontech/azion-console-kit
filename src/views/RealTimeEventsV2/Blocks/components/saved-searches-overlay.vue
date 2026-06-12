<script setup>
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import PrimeButton from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'
  import { ref } from 'vue'

  defineOptions({ name: 'SavedSearchesOverlay' })

  defineProps({
    searches: { type: Array, default: () => [] },
    // Mirrors `useSavedSearches().localStorageAvailable`. When false the
    // save button is disabled and a small hint replaces the placeholder so
    // the user understands why their input is going nowhere.
    storageAvailable: { type: Boolean, default: true }
  })

  // Emits two shapes for `save`:
  //   - string  → name only (legacy, kept for old callers)
  //   - object  → `{ name, description }` (current, recommended)
  // tab-panel-block.vue accepts both.
  const emit = defineEmits(['load', 'delete', 'save'])

  const overlayRef = ref(null)
  const saveSearchName = ref('')
  const saveSearchDescription = ref('')

  const toggle = (event) => overlayRef.value?.toggle(event)
  const hide = () => overlayRef.value?.hide()

  // Cap name at 50 chars to match the spec; description capped at 200 to
  // keep the localStorage footprint predictable even with 50 entries.
  const NAME_MAX = 50
  const DESCRIPTION_MAX = 200

  const handleSave = () => {
    const name = saveSearchName.value.trim()
    if (!name) return
    emit('save', {
      name: name.slice(0, NAME_MAX),
      description: saveSearchDescription.value.trim().slice(0, DESCRIPTION_MAX)
    })
    saveSearchName.value = ''
    saveSearchDescription.value = ''
  }

  defineExpose({ toggle, hide })
</script>

<template>
  <OverlayPanel
    ref="overlayRef"
    :showCloseIcon="false"
    class="ss-overlay"
    :pt="{ content: { class: 'p-0' } }"
  >
    <div class="ss-header">
      <span class="text-xs font-semibold text-color-secondary">Saved searches</span>
    </div>
    <div class="ss-save-row">
      <div class="flex flex-col gap-1 flex-1 min-w-0">
        <InputText
          v-model="saveSearchName"
          :placeholder="storageAvailable ? 'Name this search...' : 'Storage unavailable'"
          class="w-full text-sm"
          size="small"
          :maxlength="50"
          :disabled="!storageAvailable"
          aria-label="Saved search name"
          @keydown.enter="handleSave"
        />
        <InputText
          v-model="saveSearchDescription"
          placeholder="Description (optional)"
          class="w-full text-xs"
          size="small"
          :maxlength="200"
          :disabled="!storageAvailable"
          aria-label="Saved search description"
          @keydown.enter="handleSave"
        />
      </div>
      <PrimeButton
        icon="pi pi-save"
        text
        size="small"
        class="ss-save-btn !w-7 !h-7 flex-shrink-0"
        aria-label="Save current search"
        :disabled="!storageAvailable || !saveSearchName.trim()"
        @click="handleSave"
      />
    </div>
    <ul
      v-if="searches.length"
      class="ss-list"
    >
      <li
        v-for="entry in searches"
        :key="entry.id"
        class="ss-item"
        @click="emit('load', entry)"
      >
        <i class="pi pi-bookmark-fill text-xs text-color-secondary" />
        <div class="ss-item__body">
          <span class="ss-name">{{ entry.name }}</span>
          <span
            v-if="entry.description"
            class="ss-description"
            >{{ entry.description }}</span
          >
        </div>
        <span
          v-if="entry.dataset"
          class="qh-badge"
          >{{ entry.dataset }}</span
        >
        <PrimeButton
          icon="pi pi-times"
          text
          size="small"
          class="ss-delete-btn !w-5 !h-5 !p-0 flex-shrink-0"
          aria-label="Delete saved search"
          @click.stop="emit('delete', entry.id)"
        />
      </li>
    </ul>
    <div
      v-else
      class="p-4 text-center text-xs text-color-secondary"
    >
      No saved searches yet.
    </div>
  </OverlayPanel>
</template>

<style scoped>
  :deep(.ss-overlay) {
    width: 360px;
    max-width: calc(100vw - 2rem);
  }
  @media (max-width: 639px) {
    :deep(.ss-overlay) {
      width: calc(100vw - 1rem);
    }
  }
  @media (max-width: 1023px) {
    :deep(.ss-overlay .ss-save-btn),
    :deep(.ss-overlay .ss-delete-btn) {
      min-width: 2.75rem;
      min-height: 2.75rem;
    }
  }
  .ss-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
  }
  .ss-save-row {
    display: flex;
    align-items: flex-start;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
  }
  .ss-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    max-height: 260px;
  }
  .ss-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s;
    border-bottom: 1px solid var(--surface-border);
  }
  .ss-item:last-child {
    border-bottom: none;
  }
  .ss-item:hover {
    background: var(--surface-hover);
  }
  .ss-item__body {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
    gap: 0.125rem;
  }
  .ss-name {
    font-size: 0.78rem;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .ss-description {
    font-size: 0.65rem;
    color: var(--text-color-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .qh-badge {
    font-size: 0.65rem;
    color: var(--text-color-secondary);
    background: var(--surface-ground);
    padding: 2px 6px;
    border-radius: var(--border-radius);
    flex-shrink: 0;
    white-space: nowrap;
  }
</style>
