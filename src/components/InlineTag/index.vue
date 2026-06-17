<script setup>
  import { computed } from 'vue'

  defineOptions({ name: 'inline-tag' })

  const props = defineProps({
    text: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'success', 'warning', 'danger', 'neutral'].includes(value)
    },
    icon: {
      type: String,
      default: ''
    },
    dataTestid: {
      type: String,
      default: 'inline-tag'
    }
  })

  const TYPE_STYLES = {
    info: 'bg-[var(--info,#001833)] text-[var(--info-contrast,#66adff)]',
    success: 'bg-[#16A34A20] text-[#39E478]',
    warning: 'bg-[#FFB64D20] text-[#FFB64D]',
    danger: 'bg-[#F53D3D20] text-[#F53D3D]',
    neutral: 'bg-[var(--surface-section,#1a1a1a)] text-[var(--text-color-secondary,#999)]'
  }

  const typeClass = computed(() => TYPE_STYLES[props.type] || TYPE_STYLES.info)
</script>

<template>
  <span
    v-if="text"
    :class="[
      'inline-flex h-5 w-fit self-start items-center justify-center gap-1 rounded-[4px] px-1 text-[11px] leading-none whitespace-nowrap',
      typeClass
    ]"
    :data-testid="dataTestid"
  >
    <i
      v-if="icon"
      :class="[icon, 'text-[10px]']"
      aria-hidden="true"
    />
    {{ text }}
  </span>
</template>
