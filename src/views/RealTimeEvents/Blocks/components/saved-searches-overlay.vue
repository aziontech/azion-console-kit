<script setup>
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import PrimeButton from '@aziontech/webkit/button'
  import InputText from '@aziontech/webkit/inputtext'
  import { ref } from 'vue'

  defineOptions({ name: 'SavedSearchesOverlay' })

  defineProps({
    searches: { type: Array, default: () => [] }
  })

  const emit = defineEmits(['load', 'delete', 'save'])

  const overlayRef = ref(null)
  const saveSearchName = ref('')

  const toggle = (event) => overlayRef.value?.toggle(event)
  const hide = () => overlayRef.value?.hide()

  const handleSave = () => {
    if (!saveSearchName.value.trim()) return
    emit('save', saveSearchName.value)
    saveSearchName.value = ''
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
      <InputText
        v-model="saveSearchName"
        placeholder="Name this search..."
        class="w-full text-sm"
        size="small"
        @keydown.enter="handleSave"
      />
      <PrimeButton
        icon="pi pi-save"
        text
        size="small"
        class="!w-7 !h-7 flex-shrink-0"
        :disabled="!saveSearchName.trim()"
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
        <span class="ss-name">{{ entry.name }}</span>
        <span
          v-if="entry.dataset"
          class="qh-badge"
          >{{ entry.dataset }}</span
        >
        <PrimeButton
          icon="pi pi-times"
          text
          rounded
          size="small"
          class="!w-5 !h-5 !p-0 flex-shrink-0"
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
  .ss-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
  }
  .ss-save-row {
    display: flex;
    align-items: center;
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
  .ss-name {
    flex: 1;
    font-size: 0.78rem;
    color: var(--text-color);
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
