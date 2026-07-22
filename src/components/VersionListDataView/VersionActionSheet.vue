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
    <div class="flex flex-col px-[1.125rem] pb-5 pt-2.5 text-[var(--text-color)]">
      <div
        class="mx-auto mb-4 mt-1 h-1 w-[2.375rem] rounded-full bg-[var(--surface-500)]"
        aria-hidden="true"
      />

      <div
        v-if="title"
        class="flex min-w-0 flex-wrap items-center gap-2"
      >
        <span class="max-w-full truncate text-[1.0625rem] font-semibold text-[var(--text-color)]">{{
          title
        }}</span>
        <VersionStateBadge
          v-if="state"
          :state="state"
        />
      </div>

      <div class="my-4 h-px bg-[var(--surface-border)]" />

      <div class="flex flex-col gap-2.5">
        <template
          v-for="(item, index) in items"
          :key="index"
        >
          <div
            v-if="item.separator"
            class="my-1 h-px bg-[var(--surface-border)]"
          />
          <button
            v-else
            type="button"
            class="flex min-h-11 w-full cursor-pointer flex-col items-stretch gap-0.5 rounded-md border border-[var(--surface-border)] px-3.5 py-2 text-sm font-medium leading-6 transition-colors duration-200 enabled:hover:bg-[var(--surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            :class="
              item.class === 'danger'
                ? 'bg-transparent text-[var(--red-500)]'
                : 'bg-[var(--surface-ground)] text-[var(--text-color)]'
            "
            :disabled="item.disabled"
            data-testid="version-action-sheet__item"
            @click="runItem(item)"
          >
            <span class="flex min-w-0 items-center justify-center gap-2">
              <i
                v-if="item.icon"
                :class="item.icon"
                class="text-sm text-inherit"
                aria-hidden="true"
              />
              <span class="min-w-0 truncate">{{ item.label }}</span>
            </span>
            <span
              v-if="item.disabled && item.tooltip"
              class="text-xs font-normal text-[var(--text-color-secondary)]"
            >
              {{ item.tooltip }}
            </span>
          </button>
        </template>
      </div>
    </div>
  </Sidebar>
</template>
