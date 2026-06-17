<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :closable="!isSubmitting"
    :draggable="false"
    :style="{ width: '576px', maxWidth: 'calc(100vw - 32px)' }"
    :pt="{
      root: { class: 'overflow-hidden rounded-md border border-default' },
      header: {
        class: 'h-14 border-b border-default bg-[var(--surface-50)] px-8'
      },
      title: { class: 'text-base font-semibold leading-[21px] text-default' },
      content: { class: 'bg-[var(--surface-100)] p-0' },
      footer: { class: 'h-14 border-t border-default bg-[var(--surface-50)] px-8 m-0' }
    }"
    :header="title"
  >
    <div class="flex flex-col gap-3.5 px-8 py-5">
      <p class="whitespace-pre-line text-[13px] leading-5 text-default">
        {{ bodyText }}
      </p>

      <InlineMessage
        v-if="error"
        severity="error"
        class="text-xs break-all"
      >
        {{ error }}
      </InlineMessage>
    </div>

    <template #footer>
      <div class="flex h-14 items-center justify-end gap-2">
        <Button
          outlined
          label="Cancel"
          class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
          :disabled="isSubmitting"
          @click="close"
        />
        <Button
          :label="confirmLabel"
          :loading="isSubmitting"
          class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
          :disabled="isSubmitting"
          @click="confirm"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import Dialog from '@aziontech/webkit/dialog'
  import Button from '@aziontech/webkit/button'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import { getPlanLabel } from '@/templates/checkout-block/helpers/plan-features'
  import { formatBillingDate } from '@/utils/billing-date'

  defineOptions({ name: 'dialog-downgrade-plan' })

  const props = defineProps({
    visible: { type: Boolean, default: false },
    fromPlan: { type: String, default: 'pro' },
    toPlan: { type: String, default: 'hobby' },
    effectiveAt: { type: [String, Date], default: null },
    cycleChange: { type: Boolean, default: false },
    fromCycle: {
      type: String,
      default: null,
      validator: (value) => value === null || ['monthly', 'yearly'].includes(value)
    },
    toCycle: {
      type: String,
      default: null,
      validator: (value) => value === null || ['monthly', 'yearly'].includes(value)
    }
  })

  const emit = defineEmits(['update:visible', 'confirm', 'view-usage'])

  const isSubmitting = ref(false)
  const error = ref('')

  const isVisible = computed({
    get: () => props.visible,
    set: (value) => {
      if (!value) error.value = ''
      emit('update:visible', value)
    }
  })

  const cycleLabel = (cycle) => (cycle === 'yearly' ? 'yearly billing' : 'monthly billing')

  const title = computed(() => {
    if (props.cycleChange) {
      const toLabel = props.toCycle === 'yearly' ? 'Yearly' : 'Monthly'
      return `Downgrade to ${toLabel}`
    }
    return `Downgrade to ${getPlanLabel(props.toPlan)}`
  })

  const confirmLabel = computed(() => {
    if (error.value) return 'Retry'
    return 'Schedule downgrade'
  })

  const effectiveDate = computed(() => formatBillingDate(props.effectiveAt))

  const bodyText = computed(() => {
    const date = effectiveDate.value || '--'
    if (props.cycleChange) {
      const fromCycleLabel = cycleLabel(props.fromCycle)
      const toCycleLabel = cycleLabel(props.toCycle)
      return (
        `Your ${getPlanLabel(props.fromPlan)} plan with ${fromCycleLabel} will remain active until the end of your current billing period (${date}).\n\n` +
        `After that, the same plan will renew with ${toCycleLabel}. You can cancel this scheduled change at any time before the effective date.`
      )
    }
    const toLabel = `${getPlanLabel(props.toPlan)} plan`
    return (
      `Your current plan will remain active until the end of your billing period (${date}).\n\n` +
      `After that, your subscription will move to the ${toLabel} and new actions may be restricted if usage exceeds the plan's limits.`
    )
  })

  const close = () => {
    if (isSubmitting.value) return
    isVisible.value = false
  }

  const confirm = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true
    error.value = ''
    try {
      await new Promise((resolve, reject) => {
        emit('confirm', {
          fromPlan: props.fromPlan,
          toPlan: props.toPlan,
          fromCycle: props.fromCycle,
          toCycle: props.toCycle,
          cycleChange: props.cycleChange,
          done: resolve,
          fail: (err) =>
            reject(typeof err === 'string' ? new Error(err) : err || new Error('Failed'))
        })
      })
      isVisible.value = false
    } catch (err) {
      error.value =
        (Array.isArray(err?.message) ? err.message[0] : err?.message) ||
        'Unable to downgrade. Please try again.'
    } finally {
      isSubmitting.value = false
    }
  }
</script>
