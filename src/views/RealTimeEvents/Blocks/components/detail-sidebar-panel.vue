<script setup>
  import { computed, ref, watch } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { useToast } from '@aziontech/webkit/use-toast'
  import EventDocumentView from './event-document-view.vue'

  defineOptions({ name: 'DetailSidebarPanel' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    data: {
      type: Object,
      default: null
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    onAddFilter: {
      type: Function,
      default: null
    },
    onExcludeFilter: {
      type: Function,
      default: null
    }
  })

  const emit = defineEmits(['close', 'navigate'])

  const toast = useToast()
  const scrollRef = ref(null)

  const title = computed(() => {
    if (!props.data) return 'Document Details'
    const hostEntry = props.data.summary?.find((item) => item.key === 'host')
    if (hostEntry) return `${hostEntry.value}`
    const tsEntry = props.data.tsFormat
    return tsEntry || 'Document'
  })

  const subtitle = computed(() => {
    if (!props.data?.tsFormat) return ''
    return props.data.tsFormat
  })

  // Reset scroll on data change
  watch(
    () => props.data?.id,
    () => {
      if (scrollRef.value) {
        scrollRef.value.scrollTop = 0
      }
    }
  )
</script>

<template>
  <transition name="slide-detail-sidebar">
    <div
      v-if="visible && data"
      class="detail-sidebar"
      data-testid="detail-sidebar-panel"
    >
      <!-- Header -->
      <div class="detail-sidebar__header">
        <div class="detail-sidebar__title-group">
          <span
            class="detail-sidebar__title"
            :title="title"
          >
            {{ title }}
          </span>
          <span
            v-if="subtitle"
            class="detail-sidebar__subtitle"
          >
            {{ subtitle }}
          </span>
        </div>
        <div class="detail-sidebar__nav">
          <PrimeButton
            icon="pi pi-chevron-up"
            text
            rounded
            size="small"
            class="!w-8 !h-8"
            v-tooltip.top="{ value: 'Previous', showDelay: 300 }"
            @click="emit('navigate', -1)"
            data-testid="detail-sidebar-prev"
          />
          <PrimeButton
            icon="pi pi-chevron-down"
            text
            rounded
            size="small"
            class="!w-8 !h-8"
            v-tooltip.top="{ value: 'Next', showDelay: 300 }"
            @click="emit('navigate', 1)"
            data-testid="detail-sidebar-next"
          />
          <PrimeButton
            icon="pi pi-times"
            text
            rounded
            size="small"
            class="!w-8 !h-8"
            @click="emit('close')"
            data-testid="detail-sidebar-close"
          />
        </div>
      </div>

      <!-- Content -->
      <div
        ref="scrollRef"
        class="detail-sidebar__content"
      >
        <EventDocumentView
          :data="data"
          :onAddFilter="onAddFilter"
          :onExcludeFilter="onExcludeFilter"
          :isLoading="isLoading"
          @notify="(payload) => toast.add(payload)"
        />
      </div>
    </div>
  </transition>
</template>

<style scoped>
  /* ── Detail Sidebar Panel ─────────────────────────────────────── */
  .detail-sidebar {
    --rte-font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace;

    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--surface-border);
    background: var(--surface-ground);
    align-self: stretch;
    overflow: hidden;
    width: 380px;
    min-width: 280px;
    max-width: 40vw;
    flex-shrink: 0;
  }

  .detail-sidebar__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid var(--surface-border);
    gap: 0.5rem;
    background: var(--surface-card);
    flex-shrink: 0;
  }

  .detail-sidebar__title-group {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
    gap: 0.125rem;
  }

  .detail-sidebar__title {
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail-sidebar__subtitle {
    font-size: 0.6875rem;
    color: var(--text-color-secondary);
    font-family: var(--rte-font-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail-sidebar__nav {
    display: flex;
    align-items: center;
    gap: 0;
    flex-shrink: 0;
  }

  .detail-sidebar__content {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem 0.75rem 0;
    background: var(--surface-ground);
  }

  /* ── Transition ─────────────────────────────────────────────────── */
  .slide-detail-sidebar-enter-active,
  .slide-detail-sidebar-leave-active {
    transition: all 0.2s ease;
  }

  .slide-detail-sidebar-enter-from,
  .slide-detail-sidebar-leave-to {
    transform: translateX(100%);
    opacity: 0;
    width: 0;
    min-width: 0;
  }
</style>
