<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    position="right"
    :pt="{
      root: { class: 'w-fit border-l surface-border' },
      header: { class: 'h-14 px-4 md:px-8 py-[14px] border-b surface-border' },
      content: {
        class:
          'px-4 md:px-8 py-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
      }
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-[17.5px] leading-[21px] font-semibold text-default">Change Plan</h2>
      </div>
    </template>

    <div class="flex flex-col gap-6 min-h-full">
      <SegmentedButton
        v-model="localBillingCycle"
        :options="CYCLE_OPTIONS"
        class="self-center"
      />

      <div
        :class="[
          'flex flex-col gap-3 flex-1 bg-surface-raised',
          isHorizontalPricingCard ? '' : 'md:flex-row md:h-[200px]'
        ]"
      >
        <div
          v-for="planOption in planOptions"
          :key="planOption.value"
          class="flex flex-col gap-3 h-fit w-full"
        >
          <CardPricing
            :planTitle="planOption.label"
            :description="planOption.description"
            :pricingDetails="getPricingDetails(planOption.value)"
            :showTag="Boolean(planOption.tagLabel)"
            :tagLabel="planOption.tagLabel || 'Popular'"
            :value="getCardValue(planOption.value)"
            :prefix="getCardPrefix(planOption.value)"
            :suffix="getCardSuffix(planOption.value)"
            :showPrefix="planOption.value !== 'enterprise'"
            :showSuffix="planOption.value !== 'enterprise'"
            slotPosition="bottom"
          >
            <template #actions>
              <ActionButton
                :label="planOption.buttonLabel"
                :kind="
                  isCurrentPlanSelection(planOption.value) ||
                  planOption.value.toLowerCase() === 'enterprise'
                    ? 'outlined'
                    : 'secondary'
                "
                size="large"
                icon="pi pi-chevron-right"
                :loading="isLoadingPlan(planOption.value)"
                :disabled="isCurrentPlanSelection(planOption.value) || Boolean(props.loadingPlan)"
                class="w-full"
                @click="handleChoosePlan(planOption.value)"
              />
            </template>

            <ul class="flex flex-col gap-2">
              <li
                v-for="feature in planOption.features"
                :key="feature.label"
                class="flex items-center gap-2 text-sm text-color"
              >
                <i
                  v-if="feature.icon"
                  :class="[feature.icon, 'text-color-secondary text-sm']"
                />
                <span>{{ feature.label }}</span>
              </li>
            </ul>
          </CardPricing>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import CardPricing from '@aziontech/webkit/content/card-pricing'
  import ActionButton from '@aziontech/webkit/actions/button'
  import SegmentedButton from '@aziontech/webkit/segmented-button'
  import { useResize } from '@/composables/useResize'
  import { usePlans } from '@/composables/usePlans'
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
    },
    closeOnSelect: {
      type: Boolean,
      default: true
    },
    /**
     * When true, button labels reflect the relationship between each option and
     * the current plan ("Subscribed", "Upgrade", "Downgrade"). Used in Billing.
     * Default false preserves the onboarding labels ("Choose Plan").
     */
    relativeLabels: {
      type: Boolean,
      default: false
    },
    /**
     * SKU currently being prepared by the caller (e.g. `'pro'`). The matching
     * card renders a spinner and disables itself while the checkout session is
     * being fetched — prevents the user from re-firing the click and racing
     * the in-flight `prepareCheckoutSession`.
     */
    loadingPlan: {
      type: String,
      default: null
    },
    context: {
      type: String,
      default: 'signup',
      validator: (value) => ['signup', 'billing'].includes(value)
    }
  })

  const emit = defineEmits(['update:visible', 'select', 'billing-cycle-toggled'])
  const { windowWidth } = useResize()
  const isHorizontalPricingCard = computed(() => windowWidth.value <= 1000)
  const { setParam } = usePlans()

  const CYCLE_OPTIONS = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' }
  ]

  const localBillingCycle = ref(props.billingCycle)

  watch(localBillingCycle, (cycle, previousCycle) => {
    setParam('billingCycle', cycle)
    if (previousCycle && previousCycle !== cycle) {
      emit('billing-cycle-toggled', { fromCycle: previousCycle, toCycle: cycle })
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

  const PLAN_RANK = { hobby: 0, pro: 1, enterprise: 2 }

  const getRelativeLabel = (planValue) => {
    const target = planValue.toLowerCase()
    const current = props.currentPlan?.toLowerCase()
    if (target === 'enterprise') return 'Contact Sales'
    if (target === current) {
      if (target === 'hobby') return 'Subscribed'
      if (props.billingCycle === localBillingCycle.value) return 'Subscribed'
      return localBillingCycle.value === 'yearly' ? 'Upgrade Cycle' : 'Downgrade Cycle'
    }
    const targetRank = PLAN_RANK[target] ?? 0
    const currentRank = PLAN_RANK[current] ?? 0
    if (targetRank > currentRank) return 'Upgrade'
    return 'Downgrade'
  }

  const planOptions = computed(() => {
    if (!props.relativeLabels) return PLAN_OPTIONS
    return PLAN_OPTIONS.map((option) => ({
      ...option,
      buttonLabel: getRelativeLabel(option.value)
    }))
  })

  const getPlanData = (planValue) => {
    return props.plans?.find((plan) => plan.sku?.toLowerCase() === planValue.toLowerCase())
  }

  const formatNumeric = (value) => {
    const number = Number(value ?? 0)
    return Number.isInteger(number) ? String(number) : number.toFixed(2)
  }

  const getMonthlyPriceNumeric = (planValue) => {
    const pricing = getPlanData(planValue)?.pricings?.find((item) => item.periodicity === 'monthly')
    return Number(pricing?.priceValue ?? 0)
  }

  const getAnnualMonthlyEquivalent = (planValue) => {
    const pricing = getPlanData(planValue)?.pricings?.find((item) => item.periodicity === 'yearly')
    return Number(pricing?.priceValue ?? 0) / 12
  }

  const getCardValue = (planValue) => {
    if (planValue === 'enterprise') return 'Custom'
    const numeric =
      localBillingCycle.value === 'yearly'
        ? getAnnualMonthlyEquivalent(planValue)
        : getMonthlyPriceNumeric(planValue)
    return formatNumeric(numeric)
  }

  const getCardPrefix = (planValue) => (planValue === 'enterprise' ? '' : '$')

  const getCardSuffix = (planValue) => (planValue === 'enterprise' ? '' : 'per month')

  const getPricingDetails = (planValue) => {
    if (planValue === 'enterprise') return ''
    return localBillingCycle.value === 'yearly' ? 'Billed annually' : 'Billed monthly'
  }

  const isLoadingPlan = (planValue) =>
    Boolean(props.loadingPlan) && props.loadingPlan.toLowerCase() === planValue.toLowerCase()

  const isCurrentPlanSelection = (planValue) => {
    const target = planValue.toLowerCase()
    const isSamePlan = props.currentPlan?.toLowerCase() === target
    if (!isSamePlan) return false
    // Hobby is free and cycle-agnostic, so for hobby users the Hobby card
    // must stay disabled regardless of the monthly/yearly toggle.
    if (target === 'hobby') return true
    return props.billingCycle === localBillingCycle.value
  }

  const handleChoosePlan = (planValue) => {
    if (planValue?.toLowerCase() === 'enterprise') {
      window.open('https://www.azion.com/en/contact/', '_blank', 'noopener,noreferrer')
      return
    }

    // Belt-and-suspenders against duplicate emissions: a click that slips
    // through the `:disabled` (e.g. event queued before the prop update) must
    // not re-trigger `handlePlanSelect` while the caller is still preparing.
    if (props.loadingPlan) return

    emit('select', {
      plan: planValue,
      billingCycle: localBillingCycle.value
    })
    if (props.closeOnSelect) {
      emit('update:visible', false)
    }
  }
</script>
