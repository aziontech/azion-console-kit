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
      <div
        class="flex items-center gap-2 rounded-md border px-2 py-1.5"
        :class="bannerClass"
      >
        <span
          class="flex shrink-0 items-center justify-center rounded-md p-[7px]"
          :class="bannerIconClass"
        >
          <i
            class="pi pi-exclamation-triangle text-[12px] leading-none"
            :class="bannerIconColorClass"
          />
        </span>
        <p class="flex-1 text-xs leading-5 text-default">
          {{ bannerText }}
          <a
            v-if="bannerLink"
            :href="bannerLink.href"
            class="font-semibold text-[var(--text-color-link)] hover:underline"
            >{{ bannerLink.label }}</a
          >{{ bannerLink ? '.' : '' }}
        </p>
      </div>

      <p class="whitespace-pre-line text-[13px] leading-5 text-default">
        <template v-if="canDowngrade">
          Your current plan will remain active until the end of your billing period ({{
            effectiveDate || '--'
          }}).{{ '\n\n' }}After that, your subscription will move to the {{ toLabel }} and new
          actions may be restricted if usage exceeds its limits.
        </template>
        <template v-else>
          The {{ toLabel }} has lower usage limits than your current plan. To proceed, adjust your
          resources to fit within these limits.
        </template>
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
          :label="error ? 'Retry' : 'Schedule downgrade'"
          :icon="isSubmitting ? 'pi pi-spin pi-spinner' : ''"
          class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
          :disabled="isSubmitting || !canDowngrade"
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
    canDowngrade: { type: Boolean, default: true }
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

  const toLabel = computed(() => `${getPlanLabel(props.toPlan)} plan`)
  const title = computed(() => `Downgrade to ${getPlanLabel(props.toPlan)}`)

  const effectiveDate = computed(() => formatBillingDate(props.effectiveAt))

  const bannerText = computed(() =>
    props.canDowngrade
      ? 'This plan has lower limits than your current usage.'
      : 'You must reduce your usage before downgrading. '
  )

  const bannerLink = computed(() =>
    props.canDowngrade ? null : { label: 'View usage', href: '#' }
  )

  const bannerClass = computed(() =>
    props.canDowngrade
      ? 'bg-[rgba(255,182,77,0.1)] border-[rgba(255,182,77,0.2)]'
      : 'bg-[rgba(245,61,61,0.1)] border-[rgba(245,61,61,0.2)]'
  )

  const bannerIconClass = computed(() =>
    props.canDowngrade ? 'bg-[rgba(255,182,77,0.2)]' : 'bg-[rgba(245,61,61,0.2)]'
  )

  const bannerIconColorClass = computed(() => (props.canDowngrade ? 'text-warning' : 'text-error'))

  const close = () => {
    if (isSubmitting.value) return
    isVisible.value = false
  }

  const confirm = async () => {
    if (isSubmitting.value || !props.canDowngrade) return
    isSubmitting.value = true
    error.value = ''
    try {
      await new Promise((resolve, reject) => {
        emit('confirm', {
          fromPlan: props.fromPlan,
          toPlan: props.toPlan,
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
