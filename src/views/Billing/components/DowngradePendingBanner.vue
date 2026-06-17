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

    <p class="flex-1 text-xs leading-5 text-default">
      {{ message }}
    </p>

    <Button
      severity="secondary"
      class="h-8 px-4 font-protomono text-xs flex items-center justify-center shrink-0"
      label="Keep current plan"
      @click="$emit('cancel')"
    />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import Button from '@aziontech/webkit/button'
  import { formatBillingDate } from '@/utils/billing-date'

  defineOptions({ name: 'downgrade-pending-banner' })

  const props = defineProps({
    effectiveAt: { type: [String, Date], default: null },
    targetPlanLabel: { type: String, default: '' }
  })

  defineEmits(['cancel'])

  const formattedDate = computed(() => formatBillingDate(props.effectiveAt))

  const message = computed(() => {
    const date = formattedDate.value || '--'
    const target = props.targetPlanLabel ? ` to ${props.targetPlanLabel}` : ''
    return `You scheduled a downgrade${target} on ${date}. Your usage limits will be reduced after this date.`
  })
</script>
