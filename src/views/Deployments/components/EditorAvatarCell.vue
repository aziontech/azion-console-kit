<script setup>
  import { computed } from 'vue'
  import Avatar from '@aziontech/webkit/avatar'

  defineOptions({ name: 'editor-avatar-cell' })

  const props = defineProps({
    email: {
      type: String,
      default: ''
    }
  })

  const initials = computed(() => {
    const localPart = String(props.email || '')
      .split('@')[0]
      ?.trim()
    if (!localPart) return ''
    const parts = localPart.split(/[._-]+/).filter(Boolean)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return localPart.slice(0, 2).toUpperCase()
  })
</script>

<template>
  <div
    class="flex items-center gap-3 justify-end"
    data-testid="editor-avatar-cell"
  >
    <span
      class="text-sm text-color-secondary whitespace-nowrap overflow-hidden text-ellipsis"
      data-sentry-mask
    >
      {{ email || '--' }}
    </span>
    <Avatar
      v-if="initials"
      :label="initials"
      shape="circle"
      size="small"
      class="bg-[var(--avatar-bg)] text-color text-xs"
    />
  </div>
</template>
