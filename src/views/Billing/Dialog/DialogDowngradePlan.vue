<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :closable="!isSubmitting"
    :draggable="false"
    :style="{ width: 'min(90vw, 576px)' }"
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
      <div
        class="flex gap-3 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] leading-5 text-default"
      >
        <i class="pi pi-info-circle text-red-500 mt-0.5" />
        <p class="whitespace-pre-line">
          {{ bodyText }}
        </p>
      </div>

      <PlanFeatureComparison
        v-if="!cycleChange"
        :fromPlanLabel="getPlanLabel(fromPlan)"
        :toPlanLabel="getPlanLabel(toPlan)"
      />

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
        <ActionButton
          kind="outlined"
          size="medium"
          :label="confirmLabel"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="confirm"
        />
        <ActionButton
          kind="primary"
          size="medium"
          :label="keepLabel"
          :disabled="isSubmitting"
          @click="close"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import Dialog from '@aziontech/webkit/dialog'
  import ActionButton from '@aziontech/webkit/actions/button'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import PlanFeatureComparison from '@/views/Billing/Dialog/PlanFeatureComparison.vue'
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
    return 'Downgrade plan'
  })

  const keepLabel = computed(() => `Keep ${getPlanLabel(props.fromPlan)}`)

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
