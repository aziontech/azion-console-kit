<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    position="right"
    class="!w-full md:!w-[1158px]"
    :pt="{
      header: { class: 'h-14 px-6 py-[14px] border-b border-[var(--border-muted)]' },
      content: {
        class: 'p-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
      }
    }"
  >
    <template #header>
      <div class="flex items-center justify-between w-full">
        <h2 class="text-[17.5px] leading-[21px] font-semibold text-default">Change Plan</h2>
      </div>
    </template>

    <div class="flex flex-col gap-6 p-6">
      <div
        v-if="showCycleToggle"
        class="flex justify-center"
      >
        <SegmentedButton
          v-model="localBillingCycle"
          :options="CYCLE_OPTIONS"
        />
      </div>

      <div
        v-if="isMobile"
        class="plan-carousel-wrapper"
      >
        <Carousel
          :slidesCount="planOptions.length"
          :slidesPerView="1"
          :spaceBetween="16"
          :maxSlideWidth="360"
          :initialIndex="initialCarouselIndex"
          snapAlign="center"
          ariaLabel="Plans"
        >
          <template
            v-for="(planOption, idx) in planOptions"
            #[`slide-${idx}`]
            :key="planOption.value"
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
              :showPrefix="isPricedPlan(planOption.value)"
              :showSuffix="isPricedPlan(planOption.value)"
              slotPosition="middle"
              class="h-full"
            >
              <template #actions>
                <ActionButton
                  :label="planOption.buttonLabel"
                  :kind="resolveButtonKind(planOption.value)"
                  size="large"
                  :loading="isLoadingPlan(planOption.value)"
                  :disabled="isCurrentPlanSelection(planOption.value) || Boolean(props.loadingPlan)"
                  class="w-full"
                  @click="handleChoosePlan(planOption.value)"
                />
              </template>

              <div class="flex flex-col gap-2">
                <p
                  v-if="planOption?.sectionTitle"
                  class="text-xs leading-none text-[var(--text-muted)]"
                >
                  {{ planOption?.sectionTitle }}
                </p>
                <ul class="flex flex-col gap-2">
                  <li
                    v-for="feature in getIconFeatures(planOption)"
                    :key="feature.title"
                    class="flex items-center gap-2.5 text-xs leading-none text-color"
                  >
                    <span class="inline-flex items-center justify-center size-5 shrink-0">
                      <i :class="[feature.icon, 'text-base text-color']" />
                    </span>
                    <span>{{ feature.title }}</span>
                  </li>
                </ul>
              </div>
            </CardPricing>
          </template>
        </Carousel>
      </div>

      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
      >
        <CardPricing
          v-for="planOption in planOptions"
          :key="planOption.value"
          :planTitle="planOption.label"
          :description="planOption.description"
          :pricingDetails="getPricingDetails(planOption.value)"
          :showTag="Boolean(planOption.tagLabel)"
          :tagLabel="planOption.tagLabel || 'Popular'"
          :value="getCardValue(planOption.value)"
          :prefix="getCardPrefix(planOption.value)"
          :suffix="getCardSuffix(planOption.value)"
          :showPrefix="isPricedPlan(planOption.value)"
          :showSuffix="isPricedPlan(planOption.value)"
          slotPosition="middle"
        >
          <template #actions>
            <ActionButton
              :label="planOption.buttonLabel"
              :kind="resolveButtonKind(planOption.value)"
              size="large"
              :loading="isLoadingPlan(planOption.value)"
              :disabled="isCurrentPlanSelection(planOption.value) || Boolean(props.loadingPlan)"
              class="w-full"
              @click="handleChoosePlan(planOption.value)"
            />
          </template>

          <div class="flex flex-col gap-2">
            <p
              v-if="planOption?.sectionTitle"
              class="text-xs leading-none text-[var(--text-muted)]"
            >
              {{ planOption?.sectionTitle }}
            </p>
            <ul class="flex flex-col gap-2">
              <li
                v-for="feature in getIconFeatures(planOption)"
                :key="feature.title"
                class="flex items-center gap-2.5 text-xs leading-none text-color"
              >
                <span class="inline-flex items-center justify-center size-5 shrink-0">
                  <i :class="[feature.icon, 'text-base text-color']" />
                </span>
                <span>{{ feature.title }}</span>
              </li>
            </ul>
          </div>
        </CardPricing>
      </div>
    </div>
  </Sidebar>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import CardPricing from '@aziontech/webkit/content/card-pricing'
  import ActionButton from '@aziontech/webkit/button'
  import SegmentedButton from '@aziontech/webkit/segmented-button'
  import { usePlans } from '@/composables/usePlans'
  import { useResize } from '@/composables/useResize'
  import { getComparisonInfo } from '@/views/Billing/plan-comparison-features'
  import Carousel from '@/components/Carousel.vue'

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
  const { setParam, plan: storedPlan } = usePlans()
  const { isMobile } = useResize()

  const CYCLE_OPTIONS = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' }
  ]

  // In billing context, Pro users only have a meaningful single direction:
  // - Pro/monthly → upgrade cycle to yearly
  // - Pro/yearly  → downgrade cycle to monthly (or downgrade plan to Hobby)
  // Hide the toggle and force the opposite cycle so the Pro card shows the
  // single available cycle-change target. Signup context always shows the
  // full picker (user is choosing fresh, no current-plan constraint).
  const isProUserInBillingContext = computed(
    () => props.context === 'billing' && props.currentPlan?.toLowerCase() === 'pro'
  )

  const showCycleToggle = computed(() => !isProUserInBillingContext.value)

  const initialCycle = () => {
    if (!isProUserInBillingContext.value) return props.billingCycle
    return props.billingCycle === 'monthly' ? 'yearly' : 'monthly'
  }

  const localBillingCycle = ref(initialCycle())

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
        localBillingCycle.value = initialCycle()
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
      return localBillingCycle.value === 'yearly' ? 'Switch to Annual' : 'Downgrade Cycle'
    }
    const targetRank = PLAN_RANK[target] ?? 0
    const currentRank = PLAN_RANK[current] ?? 0
    if (targetRank > currentRank) return 'Upgrade'
    return 'Downgrade'
  }

  const BASE_PLAN_OPTIONS = computed(() => {
    return ['hobby', 'pro', 'enterprise'].map((value) => {
      const info = getComparisonInfo(value) || {}
      return {
        value,
        label: info.label,
        description: info.tagline,
        sectionTitle: info.sectionTitle,
        features: info.features ?? [],
        tagLabel: value === 'pro' ? 'Popular' : undefined,
        buttonLabel: value === 'enterprise' ? 'Contact Sales' : 'Choose Plan'
      }
    })
  })

  const planOptions = computed(() => {
    if (props.relativeLabels) {
      return BASE_PLAN_OPTIONS.value.map((option) => ({
        ...option,
        buttonLabel: getRelativeLabel(option.value)
      }))
    }
    return BASE_PLAN_OPTIONS.value.map((option) => ({
      ...option,
      buttonLabel: isCurrentPlanSelection(option.value) ? 'Selected Plan' : option.buttonLabel
    }))
  })

  // Mobile carousel opens on the plan the user previously chose (persisted in
  // localStorage via usePlans) so a returning user is not always shown Hobby
  // first. Falls back to the active subscription, then to the first option.
  const initialCarouselIndex = computed(() => {
    const preferred = storedPlan.value || props.currentPlan
    if (!preferred) return 0
    const idx = planOptions.value.findIndex(
      (option) => option.value?.toLowerCase() === preferred.toLowerCase()
    )
    return idx >= 0 ? idx : 0
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
    if (planValue === 'hobby') return 'Free'
    if (planValue === 'enterprise') return 'Custom'
    const numeric =
      localBillingCycle.value === 'yearly'
        ? getAnnualMonthlyEquivalent(planValue)
        : getMonthlyPriceNumeric(planValue)
    return formatNumeric(numeric)
  }

  const isPricedPlan = (planValue) => planValue === 'pro'

  const getCardPrefix = (planValue) => (isPricedPlan(planValue) ? '$' : '')

  const getCardSuffix = (planValue) => (isPricedPlan(planValue) ? 'per month' : '')

  const getPricingDetails = (planValue) => {
    if (isPricedPlan(planValue)) {
      return localBillingCycle.value === 'yearly' ? 'Billed annually' : 'Billed monthly'
    }
    return getComparisonInfo(planValue)?.description ?? ''
  }

  const isLoadingPlan = (planValue) =>
    Boolean(props.loadingPlan) && props.loadingPlan.toLowerCase() === planValue.toLowerCase()

  const getIconFeatures = (planOption) => {
    return (planOption?.features ?? []).filter((feature) => Boolean(feature?.icon))
  }

  const resolveButtonKind = (planValue) => {
    const target = planValue.toLowerCase()
    if (target === 'enterprise') return 'outlined'
    if (isCurrentPlanSelection(planValue)) return 'outlined'
    if (target === 'pro') return 'primary'
    return 'outlined'
  }

  const isCurrentPlanSelection = (planValue) => {
    const target = planValue.toLowerCase()
    const isSamePlan = props.currentPlan?.toLowerCase() === target
    if (!isSamePlan) return false
    // Hobby is free and cycle-agnostic, so for hobby users the Hobby card
    // must stay disabled regardless of the monthly/yearly toggle.
    if (target === 'hobby') return true
    return props.billingCycle === localBillingCycle.value
  }

  const resolveIntent = (planValue) => {
    const target = planValue.toLowerCase()
    if (target === 'enterprise') return 'contact-sales'

    const current = props.currentPlan?.toLowerCase()
    if (!current || props.context === 'signup') return 'subscribe'

    if (target === current) {
      if (target === 'hobby') return 'subscribe'
      if (props.billingCycle === localBillingCycle.value) return 'subscribe'
      return localBillingCycle.value === 'yearly' ? 'cycle-change' : 'cycle-change'
    }

    const targetRank = PLAN_RANK[target] ?? 0
    const currentRank = PLAN_RANK[current] ?? 0
    return targetRank > currentRank ? 'upgrade' : 'downgrade'
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
      billingCycle: localBillingCycle.value,
      intent: resolveIntent(planValue),
      fromPlan: props.currentPlan,
      fromCycle: props.billingCycle
    })
    if (props.closeOnSelect) {
      emit('update:visible', false)
    }
  }
</script>
