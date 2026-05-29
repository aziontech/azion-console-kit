<template>
  <div
    class="plan-selector-card border border-solid border-[var(--border-muted)] rounded-md bg-surface"
  >
    <div class="flex items-center gap-3 pl-4 pr-3 py-3">
      <div class="flex flex-col gap-[2px] flex-1 min-w-0">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="font-semibold text-default">{{ planLabel }}</span>
          <div
            class="flex items-center h-[26px] rounded-[6px] border border-[var(--border-muted)] px-2 surface-section w-fit"
          >
            <span class="font-protomono text-xs leading-4 text-color">
              {{ priceTagLabel }}
            </span>
          </div>
        </div>

        <p class="text-xs leading-4 text-color-secondary">{{ description }}</p>
      </div>

      <ActionButton
        kind="outlined"
        size="small"
        class="shrink-0"
        @click="emit('change')"
        label="Change"
      />
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import ActionButton from '@aziontech/webkit/actions/button'

  defineOptions({
    name: 'plan-selector-card'
  })

  const props = defineProps({
    plan: {
      type: String,
      required: true,
      validator: (value) => ['hobby', 'pro'].includes(value)
    },
    planData: {
      type: Object,
      default: () => ({})
    },
    billingCycle: {
      type: String,
      default: 'yearly',
      validator: (value) => ['monthly', 'yearly'].includes(value)
    }
  })

  const emit = defineEmits(['change'])

  const planInfo = {
    hobby: {
      label: 'Hobby',
      tagLabel: 'Hobby Plan',
      description: 'Start free for personal projects and learning.'
    },
    pro: {
      label: 'Pro',
      tagLabel: 'Pro Plan',
      description: 'For professional or commercial use.'
    }
  }

  const planLabel = computed(() => planInfo[props.plan]?.tagLabel || `${props.plan} Plan`)
  const description = computed(() => planInfo[props.plan]?.description || '')

  const price = computed(() => {
    if (!props.planData?.pricings?.length) return 0

    const selectedPricing =
      props.planData.pricings.find(
        (pricingItem) => pricingItem.periodicity === props.billingCycle
      ) ||
      props.planData.pricings.find((pricingItem) => pricingItem.periodicity === 'monthly') ||
      props.planData.pricings[0]

    return Number(selectedPricing?.priceValue || 0)
  })

  const formattedPrice = computed(() => {
    return Number.isInteger(price.value) ? String(price.value) : price.value.toFixed(2)
  })

  const isFreePlan = computed(() => props.plan === 'hobby' || price.value <= 0)

  const billingSuffix = computed(() => (props.billingCycle === 'yearly' ? '/yr' : '/mo'))

  const priceTagLabel = computed(() =>
    isFreePlan.value ? 'Free' : `$${formattedPrice.value}${billingSuffix.value}`
  )
</script>

<style scoped>
  .plan-selector-card {
    transition: border-color 0.2s ease;
  }

  .plan-selector-card:hover {
    border-color: var(--border-hover);
  }
</style>
