<template>
  <Teleport to="body">
    <Sidebar
      v-model:visible="visibleDrawer"
      position="right"
      :pt="{
        root: { class: 'w-fit border-l surface-border' },
        header: { class: 'h-14 px-8 py-[14px] border-b surface-border' },
        content: { class: 'px-8 py-6' }
      }"
    >
      <template #header>
        <div class="flex items-center justify-between w-full">
          <h2 class="text-[17.5px] leading-[21px] font-semibold text-default">Change Plan</h2>
        </div>
      </template>

      <div class="flex flex-col gap-6 min-h-full">
        <Toggle
          v-model="billingCycleToggleValue"
          class="self-center scale-[0.85]"
          mainLabel="Monthly"
          alternativeLabel="Yearly"
        />

        <div class="flex gap-3 flex-1 bg-surface-raised h-[200px]">
          <div
            v-for="planOption in planOptions"
            :key="planOption.value"
            class="flex flex-col gap-3 h-fit"
          >
            <PricingCard
              :title="planOption.label"
              :subtitle="planOption.description"
              :features="getNormalizedFeatures(planOption.features)"
              :monthlyPrice="getMonthlyPrice(planOption.value)"
              :annualPrice="getAnnualPrice(planOption.value)"
              :currentPeriod="localBillingCycle === 'yearly' ? 'annual' : 'monthly'"
              :priceLabel="getPriceLabel(planOption.value)"
              :popular="Boolean(planOption.tagLabel)"
              :pupularText="planOption.tagLabel || 'Popular'"
              :customPrice="getCustomPrice(planOption.value)"
            >
              <template #button>
                <Button
                  severity="secondary"
                  class="h-[42px] font-protomono text-sm tracking-[-0.14px]"
                  :label="planOption.buttonLabel"
                  icon="pi pi-chevron-right"
                  :disabled="isCurrentPlanSelection(planOption.value)"
                  iconPos="left"
                  :outlined="
                    isCurrentPlanSelection(planOption.value) ||
                    planOption.value.toLowerCase() === 'enterprise'
                  "
                  @click="handleChoosePlan(planOption.value)"
                />
              </template>
            </PricingCard>
          </div>
        </div>
      </div>
    </Sidebar>
  </Teleport>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import PricingCard from '@aziontech/webkit/pricing-card'
  import Button from '@aziontech/webkit/button'
  import Toggle from '@aziontech/webkit/toggle'
  import { PLAN_OPTIONS } from '@/templates/signup-block/plan-options'

  defineOptions({
    name: 'plan-selection-drawer'
  })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    plans: {
      type: Array,
      default: () => []
    },
    currentPlan: {
      type: String,
      default: 'hobby'
    },
    billingCycle: {
      type: String,
      default: 'yearly'
    }
  })

  const emit = defineEmits(['update:visible', 'select'])

  const localBillingCycle = ref(props.billingCycle)

  const billingCycleToggleValue = computed({
    get: () => (localBillingCycle.value === 'yearly' ? 'alternative' : 'main'),
    set: (value) => {
      localBillingCycle.value = value === 'alternative' ? 'yearly' : 'monthly'
    }
  })

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  watch(
    () => props.visible,
    (newVisible) => {
      if (newVisible) {
        localBillingCycle.value = props.billingCycle
      }
    }
  )

  const planOptions = PLAN_OPTIONS

  const getPlanData = (planValue) => {
    return props.plans?.find((plan) => plan.sku?.toLowerCase() === planValue.toLowerCase())
  }

  const getPriceByPeriod = (planValue, period) => {
    if (planValue === 'enterprise') return ''

    const pricing = getPlanData(planValue)?.pricings?.find((item) => item.periodicity === period)
    const priceValue = Number(pricing?.priceValue ?? 0)
    const formatted = Number.isInteger(priceValue) ? String(priceValue) : priceValue.toFixed(2)
    return `$${formatted}`
  }

  const getMonthlyPrice = (planValue) => getPriceByPeriod(planValue, 'monthly')

  const getAnnualPrice = (planValue) => getPriceByPeriod(planValue, 'yearly')

  const getCustomPrice = (planValue) => {
    if (planValue === 'enterprise') return 'Custom'
    return ''
  }

  const getPriceLabel = (planValue) => {
    if (planValue === 'enterprise' || planValue === 'hobby') return ''
    return 'started at'
  }

  const normalizeFeatureIcon = (icon) => {
    if (!icon) return ''
    if (icon.startsWith('pi pi-')) return icon.replace('pi ', '')
    if (icon.startsWith('pi-')) return icon
    return ''
  }

  const getNormalizedFeatures = (features = []) => {
    return features.map((feature) => ({
      label: feature.label,
      icon: normalizeFeatureIcon(feature.icon)
    }))
  }

  const isCurrentPlanSelection = (planValue) => {
    const isSamePlan = props.currentPlan?.toLowerCase() === planValue.toLowerCase()
    const isSameBillingCycle = props.billingCycle === localBillingCycle.value
    return isSamePlan && isSameBillingCycle
  }

  const handleChoosePlan = (planValue) => {
    if (planValue?.toLowerCase() === 'enterprise') {
      window.open('https://www.azion.com/en/contact/', '_blank', 'noopener,noreferrer')
      return
    }

    emit('select', {
      plan: planValue,
      billingCycle: localBillingCycle.value
    })
    emit('update:visible', false)
  }
</script>
