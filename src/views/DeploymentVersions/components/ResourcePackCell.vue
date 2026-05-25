<script setup>
  import { ref } from 'vue'
  import OverlayPanel from '@aziontech/webkit/overlaypanel'
  import Tag from '@aziontech/webkit/tag'

  defineOptions({ name: 'resource-pack-cell' })

  defineProps({
    display: {
      type: Object,
      required: true
    }
  })

  const overflowPanelRef = ref(null)

  const showOverflowPanel = (event) => {
    overflowPanelRef.value?.show(event)
  }

  const hideOverflowPanel = () => {
    overflowPanelRef.value?.hide()
  }
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div
      v-for="resourceItem in display.rows"
      :key="resourceItem.key"
      :class="[
        'flex w-full min-w-0 items-center gap-1.5',
        resourceItem.isPlaceholder && 'opacity-60'
      ]"
    >
      <div class="flex w-[40%] gap-2">
        <i
          :class="resourceItem.icon"
          class="text-sm text-[var(--text-color-secondary)]"
        />
        <span class="text-xs leading-6 text-[var(--text-color-secondary)]"
          >{{ resourceItem.label }}:</span
        >
      </div>
      <div class="flex gap-2 w-full justify-start">
        <span class="overflow-hidden text-ellipsis whitespace-nowrap">{{ resourceItem.name }}</span>
        <span
          v-if="resourceItem.hash"
          class="whitespace-nowrap font-mono text-xs leading-6 text-[var(--text-color-secondary)] opacity-60"
        >
          {{ resourceItem.hash }}
        </span>
      </div>
    </div>

    <div
      v-if="display.overflowCount > 0"
      class="flex w-full min-w-0 items-center gap-1.5"
    >
      <div class="flex w-[40%] items-center gap-2">
        <i class="pi pi-ellipsis-h text-sm leading-6 text-[var(--text-color-secondary)]" />
        <span class="text-xs leading-6 text-[var(--text-color-secondary)]">Other resources:</span>
      </div>
      <div class="flex gap-2 w-full justify-start">
        <Tag
          severity="info"
          :value="`+${display.overflowCount}`"
          class="cursor-default"
          tabindex="0"
          aria-label="Show remaining resources"
          @mouseenter="showOverflowPanel"
          @mouseleave="hideOverflowPanel"
          @focus="showOverflowPanel"
          @blur="hideOverflowPanel"
        />
        <OverlayPanel
          ref="overflowPanelRef"
          :pt="{
            root: { class: 'resource-overflow-panel' },
            content: { class: 'p-0' }
          }"
        >
          <div class="flex w-max max-w-[28rem] flex-col gap-1.5 p-3">
            <span
              class="text-[10px] font-medium uppercase tracking-[0.0625rem] text-[var(--text-color-secondary)]"
            >
              Other resources
            </span>
            <div
              v-for="overflowItem in display.overflowItems"
              :key="overflowItem.key"
              class="flex w-full min-w-0 items-center gap-3"
            >
              <div class="flex shrink-0 items-center gap-2">
                <i
                  :class="overflowItem.icon"
                  class="text-sm leading-6 text-[var(--text-color-secondary)]"
                />
                <span class="whitespace-nowrap text-xs leading-6 text-[var(--text-color-secondary)]"
                  >{{ overflowItem.label }}:</span
                >
              </div>
              <div class="flex min-w-0 flex-1 items-center gap-2">
                <span
                  class="overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-6 text-[var(--text-color)]"
                  >{{ overflowItem.name }}</span
                >
                <span
                  v-if="overflowItem.hash"
                  class="whitespace-nowrap font-mono text-[0.6875rem] leading-6 text-[var(--text-color-secondary)] opacity-60"
                >
                  {{ overflowItem.hash }}
                </span>
              </div>
            </div>
          </div>
        </OverlayPanel>
      </div>
    </div>
  </div>
</template>

<style scoped>
  :deep(.resource-overflow-panel) {
    border: 1px solid var(--surface-border);
    border-radius: 0.5rem;
    background: var(--surface-section);
    box-shadow: 0 8px 24px color-mix(in srgb, var(--surface-900, #111827) 16%, transparent);
  }
</style>
