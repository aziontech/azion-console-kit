<script setup>
  import { computed } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'

  defineOptions({ name: 'version-action-sheet' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: [String, Number],
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    // The already-mapped row menu model (mapVersionMenuItemsToMenu): each entry is
    // either { separator: true } or { label, icon, disabled, class, tooltip, command }.
    items: {
      type: Array,
      default: () => []
    }
  })

  const emit = defineEmits(['update:visible'])

  const visibleSheet = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  // The item's command already stops propagation and dispatches `row-action`
  // through the shared mapper; the sheet only forwards the tap and closes.
  const runItem = (item) => {
    if (item?.disabled) return
    item?.command?.()
    emit('update:visible', false)
  }
</script>

<template>
  <Sidebar
    v-model:visible="visibleSheet"
    position="bottom"
    :show-close-icon="false"
    block-scroll
    :pt="{
      root: {
        class:
          'version-action-sheet w-full !h-auto max-h-[85vh] p-0 rounded-t-2xl overflow-hidden bg-[var(--surface-section)]'
      },
      header: { class: '!hidden' },
      content: { class: '!p-0 !h-auto' }
    }"
  >
    <div class="action-sheet">
      <div
        class="action-sheet__handle"
        aria-hidden="true"
      />

      <div
        v-if="title"
        class="action-sheet__header"
      >
        <span class="action-sheet__title">{{ title }}</span>
        <VersionStateBadge
          v-if="state"
          :state="state"
        />
      </div>

      <div class="action-sheet__divider" />

      <div class="action-sheet__actions">
        <template
          v-for="(item, index) in items"
          :key="index"
        >
          <div
            v-if="item.separator"
            class="action-sheet__sep"
          />
          <button
            v-else
            type="button"
            class="action-sheet__button"
            :class="{ 'action-sheet__button--danger': item.class === 'danger' }"
            :disabled="item.disabled"
            @click="runItem(item)"
          >
            <span class="action-sheet__button-main">
              <i
                v-if="item.icon"
                :class="item.icon"
                class="action-sheet__button-icon"
                aria-hidden="true"
              />
              <span class="action-sheet__button-label">{{ item.label }}</span>
            </span>
            <span
              v-if="item.disabled && item.tooltip"
              class="action-sheet__button-hint"
            >
              {{ item.tooltip }}
            </span>
          </button>
        </template>
      </div>
    </div>
  </Sidebar>
</template>

<style scoped>
  .action-sheet {
    display: flex;
    flex-direction: column;
    padding: 0.625rem 1.125rem 1.25rem;
    color: var(--text-color);
  }

  .action-sheet__handle {
    width: 2.375rem;
    height: 0.25rem;
    border-radius: 9999px;
    background: var(--surface-500);
    margin: 0.25rem auto 1rem;
  }

  .action-sheet__header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
    min-width: 0;
  }

  .action-sheet__title {
    font-size: 1.0625rem;
    font-weight: 600;
    color: var(--text-color);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 100%;
  }

  .action-sheet__divider {
    height: 1px;
    background: var(--surface-border);
    margin: 1rem 0;
  }

  .action-sheet__actions {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .action-sheet__sep {
    height: 1px;
    background: var(--surface-border);
    margin: 0.25rem 0;
  }

  .action-sheet__button {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0.125rem;
    width: 100%;
    min-height: 2.75rem;
    padding: 0.5rem 0.875rem;
    border: 1px solid var(--surface-border);
    border-radius: 0.375rem;
    background: var(--surface-ground);
    color: var(--text-color);
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.5rem;
    cursor: pointer;
    transition: background-color 200ms ease-in-out;
  }

  .action-sheet__button:hover {
    background: var(--surface-hover);
  }

  .action-sheet__button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .action-sheet__button:disabled:hover {
    background: var(--surface-ground);
  }

  .action-sheet__button--danger {
    background: transparent;
    color: var(--red-500);
  }

  .action-sheet__button-main {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-width: 0;
  }

  .action-sheet__button-icon {
    font-size: 0.875rem;
    color: inherit;
  }

  .action-sheet__button-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .action-sheet__button-hint {
    font-size: 0.75rem;
    font-weight: 400;
    color: var(--text-color-secondary);
  }
</style>
