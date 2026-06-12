<template>
  <div
    class="flex items-center gap-2.5 rounded-md border border-solid px-4 py-3 mt-4"
    :style="{
      backgroundColor: 'rgba(255,182,77,0.1)',
      borderColor: 'rgba(255,182,77,0.2)'
    }"
  >
    <div
      class="flex items-center justify-center rounded-md shrink-0 w-8 h-8"
      :style="{ backgroundColor: 'rgba(255,182,77,0.2)' }"
    >
      <i
        class="pi pi-exclamation-triangle"
        :style="{ fontSize: '14px', lineHeight: '14px', color: '#ffb64d' }"
      />
    </div>

    <div class="flex-1 flex flex-col gap-0.5">
      <p class="text-xs leading-5 text-color">
        {{ mainMessage }}
      </p>
      <p class="text-xs leading-5 text-color-secondary">
        Your usage limits will be reduced after this date.
      </p>
    </div>

    <ActionButton
      kind="secondary"
      size="small"
      label="Keep current plan"
      class="shrink-0"
      @click="$emit('cancel')"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import ActionButton from '@aziontech/webkit/actions/button'
  import { formatBillingDate } from '@/utils/billing-date'

  defineOptions({ name: 'downgrade-pending-banner' })

  const props = defineProps({
    effectiveAt: { type: [String, Date], default: null },
    targetPlanLabel: { type: String, default: '' }
  })

  defineEmits(['cancel'])

  const formattedDate = computed(() => formatBillingDate(props.effectiveAt))

  const mainMessage = computed(() => {
    const date = formattedDate.value || '--'
    const target = props.targetPlanLabel ? ` to ${props.targetPlanLabel}` : ''
    return `You scheduled a downgrade${target} on ${date}.`
  })
</script>
