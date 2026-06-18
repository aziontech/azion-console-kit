<script setup>
  import { computed } from 'vue'
  import { normalizeText } from '@/helpers/deployment-status'

  defineOptions({ name: 'deployment-status-tag' })

  const props = defineProps({
    status: {
      type: Object,
      default: () => ({ content: 'Unknown', severity: 'secondary' })
    }
  })

  const SEVERITY_DOT_COLOR = {
    success: 'text-[var(--success-contrast,#52e086)]',
    info: 'text-[var(--info-contrast,#66adff)]',
    warning: 'text-[var(--warning-contrast,#f7bd08)]',
    danger: 'text-[var(--danger-contrast,#ed7878)]',
    alt: 'text-[var(--primary,#f3652b)]',
    secondary: 'text-[var(--text-muted,#999999)]'
  }

  const MUTED_COLOR = 'text-[var(--text-muted,#999999)]'

  const severity = computed(() => props.status?.severity || 'secondary')
  const label = computed(() => props.status?.content || 'Unknown')

  const isLoading = computed(() => normalizeText(props.status?.content) === 'building')

  const dotColorClass = computed(() =>
    isLoading.value
      ? MUTED_COLOR
      : SEVERITY_DOT_COLOR[severity.value] || SEVERITY_DOT_COLOR.secondary
  )
  const dotIcon = computed(() =>
    isLoading.value ? 'pi pi-spinner animate-spin' : 'pi pi-circle-fill'
  )
  const labelColorClass = computed(() =>
    isLoading.value ? MUTED_COLOR : 'text-[var(--text-default,#fafafa)]'
  )
</script>

<template>
  <span class="inline-flex items-center gap-1 whitespace-nowrap">
    <i
      :class="[dotIcon, dotColorClass, 'text-[10px] leading-none']"
      aria-hidden="true"
    />
    <span :class="['text-xs leading-none', labelColorClass]">
      {{ label }}
    </span>
    <span
      v-if="isLoading"
      :class="['text-xs leading-none', labelColorClass]"
      aria-hidden="true"
    >
      ...
    </span>
  </span>
</template>
