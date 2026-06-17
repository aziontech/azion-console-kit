<script setup>
  import { computed, useSlots } from 'vue'

  defineOptions({ name: 'message-card' })

  const props = defineProps({
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['info', 'warning', 'success', 'error'].includes(value)
    },
    icon: {
      type: String,
      default: ''
    },
    dataTestid: {
      type: String,
      default: 'message-card'
    }
  })

  const slots = useSlots()

  const TYPE_STYLES = {
    info: {
      icon: 'pi pi-info-circle',
      containerClass: 'bg-[var(--info,#001833)] border-[var(--info-border,rgba(0,114,245,0.5))]',
      iconColorClass: 'text-[var(--text-info,#0072F5)]'
    },
    success: {
      icon: 'pi pi-check-circle',
      containerClass:
        'bg-[var(--success,#011803)] border-[var(--success-border,rgba(57,228,120,0.5))]',
      iconColorClass: 'text-[var(--text-success,#39E478)]'
    },
    warning: {
      icon: 'pi pi-exclamation-triangle',
      containerClass:
        'bg-[var(--warning,#191301)] border-[var(--warning-border,rgba(247,189,8,0.5))]',
      iconColorClass: 'text-[var(--text-warning,#F7BD08)]'
    },
    error: {
      icon: 'pi pi-times-circle',
      containerClass: 'bg-[var(--error,#190101)] border-[var(--error-border,rgba(245,61,61,0.5))]',
      iconColorClass: 'text-[var(--text-error,#F53D3D)]'
    }
  }

  const style = computed(() => TYPE_STYLES[props.type])
  const resolvedIcon = computed(() => props.icon || style.value.icon)
  const hasActions = computed(() => Boolean(slots.actions))
</script>

<template>
  <div
    :class="[
      'flex items-center gap-2 rounded px-3 py-2 shadow-sm w-full border min-h-[44px]',
      style.containerClass
    ]"
    :data-testid="dataTestid"
    role="status"
  >
    <div class="flex items-center justify-center shrink-0 w-5 h-5 self-start mt-0.5">
      <i :class="[resolvedIcon, 'text-base', style.iconColorClass]" />
    </div>

    <div class="flex-1 min-w-0 flex flex-col gap-1">
      <p
        v-if="title"
        class="text-xs leading-tight text-color font-medium m-0"
        :data-testid="`${dataTestid}__title`"
      >
        {{ title }}
      </p>
      <p
        v-if="description"
        class="text-xs leading-tight text-color-secondary m-0"
        :data-testid="`${dataTestid}__description`"
      >
        {{ description }}
      </p>
    </div>

    <div
      v-if="hasActions"
      class="flex items-center gap-2 shrink-0"
    >
      <slot name="actions" />
    </div>
  </div>
</template>
