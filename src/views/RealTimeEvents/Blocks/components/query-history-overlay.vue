<script setup>
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import PrimeButton from '@aziontech/webkit/button'
  import { ref } from 'vue'

  defineOptions({ name: 'QueryHistoryOverlay' })

  defineProps({
    history: { type: Array, default: () => [] },
    getHistoryParts: { type: Function, required: true }
  })

  const emit = defineEmits(['load', 'remove', 'clear'])

  const overlayRef = ref(null)

  const toggle = (event) => overlayRef.value?.toggle(event)
  const hide = () => overlayRef.value?.hide()

  defineExpose({ toggle, hide })
</script>

<template>
  <OverlayPanel
    ref="overlayRef"
    :showCloseIcon="false"
    class="query-history-overlay"
    :pt="{ content: { class: 'p-0' } }"
  >
    <div class="qh-header">
      <span class="text-xs font-semibold text-color-secondary">Recent queries</span>
      <PrimeButton
        v-if="history.length"
        icon="pi pi-trash"
        text
        rounded
        severity="danger"
        size="small"
        class="!w-6 !h-6"
        @click="emit('clear')"
      />
    </div>
    <ul
      v-if="history.length"
      class="qh-list"
    >
      <li
        v-for="(entry, idx) in history"
        :key="idx"
        class="qh-item"
        @click="emit('load', entry)"
      >
        <template
          v-for="(part, fIdx) in getHistoryParts(entry)"
          :key="fIdx"
        >
          <span
            v-if="fIdx > 0"
            class="qh-join"
            >AND</span
          >
          <span class="qh-field">{{ part.field }}</span>
          <span
            v-if="part.operator"
            class="qh-badge"
            >{{ part.operator }}</span
          >
          <span class="qh-value">{{ part.value }}</span>
        </template>
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
          @click.stop="emit('remove', idx)"
        />
      </li>
    </ul>
    <div
      v-else
      class="p-4 text-center text-xs text-color-secondary"
    >
      No query history yet.
    </div>
  </OverlayPanel>
</template>

<style scoped>
  .query-history-overlay {
    width: 400px;
    max-width: calc(100vw - 2rem);
  }
  .qh-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
  }
  .qh-list {
    list-style: none;
    margin: 0;
    padding: 0;
    overflow-y: auto;
    max-height: 260px;
  }
  .qh-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    transition: background-color 0.15s;
    border-bottom: 1px solid var(--surface-border);
  }
  .qh-item:last-child {
    border-bottom: none;
  }
  .qh-item:hover {
    background: var(--surface-hover);
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
  .qh-field {
    font-family: var(--rte-font-mono, ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace);
    font-size: 0.75rem;
    color: var(--text-color);
    flex-shrink: 0;
    white-space: nowrap;
  }
  .qh-value {
    font-family: var(--rte-font-mono, ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace);
    font-size: 0.75rem;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }
  .qh-join {
    font-size: 0.65rem;
    color: var(--text-color-secondary);
    flex-shrink: 0;
  }
</style>
