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
      containerClass:
        'bg-[var(--info,#001833)] border border-[var(--info-border,rgba(0,114,245,0.5))]',
      iconColorClass: 'text-[var(--text-info,#0072F5)]'
    },
    warning: {
      icon: 'pi pi-exclamation-triangle',
      containerClass: 'bg-[#FFB64D20] border border-[#FFB64D40]',
      iconColorClass: 'text-[#FFB64D]'
    },
    success: {
      icon: 'pi pi-check-circle',
      containerClass: 'bg-[#16A34A20] border border-[#39E47840]',
      iconColorClass: 'text-[#39E478]'
    },
    error: {
      icon: 'pi pi-times-circle',
      containerClass: 'bg-[#F53D3D20] border border-[#F53D3D40]',
      iconColorClass: 'text-[#F53D3D]'
    }
  }

  const style = computed(() => TYPE_STYLES[props.type])
  const resolvedIcon = computed(() => props.icon || style.value.icon)
  const hasActions = computed(() => Boolean(slots.actions))
</script>

<template>
  <div
    :class="[
      'flex items-start gap-2 rounded-md px-3 py-3 shadow-sm w-full',
      style.containerClass
    ]"
    :data-testid="dataTestid"
    role="status"
  >
    <div class="flex items-center justify-center shrink-0 w-5 h-5">
      <i :class="[resolvedIcon, 'text-base', style.iconColorClass]" />
    </div>

    <div class="flex-1 min-w-0 flex flex-col gap-0.5">
      <p
        v-if="title"
        class="text-xs leading-tight text-color"
        :data-testid="`${dataTestid}__title`"
      >
        {{ title }}
      </p>
      <p
        v-if="description"
        class="text-xs leading-tight text-color-secondary"
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
