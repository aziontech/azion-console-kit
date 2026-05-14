<script setup>
  import { computed } from 'vue'
  import { normalizeText } from '@/views/Deployments/helpers/deployment-status'

  defineOptions({ name: 'deployment-status-tag' })

  const props = defineProps({
    status: {
      type: Object,
      default: () => ({ content: 'Unknown', severity: 'secondary' })
    }
  })

  // Palette mirrors @aziontech/webkit/azion-system-status so this wrapper
  // can be swapped for the webkit component once it accepts props.
  const SEVERITY_COLOR = {
    success: '#8bc249',
    warning: '#fec111',
    danger: '#ff4141',
    info: '#6e7cf7',
    secondary: 'var(--text-color-secondary)'
  }

  const severity = computed(() => props.status?.severity || 'secondary')
  const color = computed(() => SEVERITY_COLOR[severity.value] || SEVERITY_COLOR.secondary)
  const label = computed(() => props.status?.content || 'Unknown')

  const isBuilding = computed(() => normalizeText(props.status?.content) === 'building')
  const icon = computed(() =>
    isBuilding.value ? 'pi pi-spinner animate-spin' : 'pi pi-circle-fill'
  )
  const iconStyle = computed(() => ({ color: color.value }))
</script>

<template>
  <span class="inline-flex items-center gap-2 whitespace-nowrap">
    <i
      :class="[icon, 'text-[10px]']"
      :style="iconStyle"
    />
    <span class="font-mono text-xs leading-relaxed text-[var(--text-color)]">
      {{ label }}
    </span>
  </span>
</template>
