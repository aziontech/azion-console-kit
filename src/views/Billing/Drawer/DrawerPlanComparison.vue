<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    position="right"
    class="!w-full md:!w-[1158px]"
  >
    <template #header>
      <h2 class="text-2xl font-semibold text-color">Change Plan</h2>
    </template>

    <div class="flex flex-col gap-8 px-8 pb-8">
      <div
        v-if="showCycleToggle"
        class="flex justify-center"
      >
        <SegmentedButton
          v-model="cycle"
          :options="cycleOptions"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <CardPricing
          v-for="card in planCards"
          :key="card.key"
          :planTitle="card.planTitle"
          :description="card.description"
          :pricingDetails="card.pricingDetails"
          :showTag="card.showTag"
          :tagLabel="card.tagLabel"
          :value="card.value"
          :prefix="card.prefix"
          :suffix="card.suffix"
          :showPrefix="card.showPrefix"
          :showSuffix="card.showSuffix"
          slotPosition="bottom"
        >
          <template #actions>
            <ActionButton
              :label="card.buttonLabel"
              :kind="card.buttonKind"
              size="large"
              :disabled="card.buttonDisabled"
              class="w-full"
              @click="card.onAction"
            />
          </template>

          <ul class="flex flex-col gap-2">
            <li
              v-for="feature in card.features"
              :key="feature.title"
              class="flex items-center gap-2 text-sm text-color"
            >
              <i
                v-if="feature.icon"
                :class="[feature.icon, 'text-color-secondary text-sm']"
              />
              <span>{{ feature.title }}</span>
            </li>
          </ul>
        </CardPricing>
      </div>
    </div>
  </Sidebar>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import SegmentedButton from '@aziontech/webkit/segmented-button'
  import CardPricing from '@aziontech/webkit/content/card-pricing'
  import ActionButton from '@aziontech/webkit/actions/button'
  import { getComparisonInfo } from '@/views/Billing/plan-comparison-features'
  import { getPlanPricing } from '@/composables/usePlansService'

  defineOptions({ name: 'drawer-plan-comparison' })

  const props = defineProps({
    visible: { type: Boolean, default: false },
    currentPlan: { type: String, default: 'hobby' },
    currentCycle: { type: String, default: 'monthly' },
    plans: { type: Array, default: () => [] },
    contactSalesUrl: { type: String, default: 'mailto:sales@azion.com' }
  })

  const emit = defineEmits([
    'update:visible',
    'select-pro-upgrade',
    'select-downgrade-hobby',
    'select-cycle-change'
  ])

  const isCurrentPro = computed(() => props.currentPlan === 'pro')
  const isCurrentHobby = computed(() => props.currentPlan === 'hobby')

  const resolveInitialCycle = () => {
    if (isCurrentPro.value) return 'yearly'
    return props.currentCycle === 'yearly' ? 'yearly' : 'monthly'
  }

  const cycle = ref(resolveInitialCycle())

  watch(
    () => [props.currentCycle, props.currentPlan],
    () => {
      cycle.value = resolveInitialCycle()
    }
  )

  const showCycleToggle = computed(() => !isCurrentPro.value)

  const cycleOptions = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' }
  ]

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const proPricing = computed(() => getPlanPricing(props.plans, 'pro'))

  const proMonthlyPrice = computed(() => proPricing.value.monthly || 0)
  const proYearlyMonthlyEquivalent = computed(() =>
    proPricing.value.yearly ? proPricing.value.yearly / 12 : 0
  )

  const proYearlyDiscountPct = computed(() => {
    if (!proMonthlyPrice.value || !proYearlyMonthlyEquivalent.value) return 0
    const pct = Math.round(
      ((proMonthlyPrice.value - proYearlyMonthlyEquivalent.value) / proMonthlyPrice.value) * 100
    )
    return pct > 0 ? pct : 0
  })

  const proPriceValue = computed(() => {
    const value =
      cycle.value === 'yearly' ? proYearlyMonthlyEquivalent.value : proMonthlyPrice.value
    return value ? String(Math.round(value)) : '0'
  })

  const proPricingDetails = computed(() => {
    if (cycle.value === 'yearly' && proYearlyDiscountPct.value > 0) {
      return `Billed annually (save ${proYearlyDiscountPct.value}%)`
    }
    if (cycle.value === 'yearly') return 'Billed annually'
    return 'Billed monthly'
  })

  const proCycleSwapLabel = computed(() => {
    if (!isCurrentPro.value) return 'Upgrade'
    return props.currentCycle === 'monthly' ? 'Upgrade to Yearly' : 'Change to Monthly'
  })

  const planCards = computed(() => {
    const hobby = getComparisonInfo('hobby')
    const pro = getComparisonInfo('pro')
    const enterprise = getComparisonInfo('enterprise')

    return [
      {
        key: 'hobby',
        planTitle: hobby.label,
        description: hobby.tagline,
        pricingDetails: hobby.description,
        showTag: false,
        tagLabel: '',
        value: '0',
        prefix: '$',
        suffix: 'forever',
        showPrefix: false,
        showSuffix: true,
        features: hobby.features,
        buttonLabel: isCurrentHobby.value ? 'Actual plan' : 'Downgrade',
        buttonKind: 'outlined',
        buttonDisabled: isCurrentHobby.value,
        onAction: () => emit('select-downgrade-hobby')
      },
      {
        key: 'pro',
        planTitle: pro.label,
        description: pro.tagline,
        pricingDetails: proPricingDetails.value,
        showTag: true,
        tagLabel: isCurrentPro.value ? 'Current plan' : 'Recommended',
        value: proPriceValue.value,
        prefix: '$',
        suffix: 'per month',
        showPrefix: true,
        showSuffix: true,
        features: pro.features,
        buttonLabel: isCurrentPro.value ? proCycleSwapLabel.value : 'Upgrade',
        buttonKind: 'primary',
        buttonDisabled: false,
        onAction: () => {
          if (isCurrentPro.value) {
            emit('select-cycle-change', cycle.value === 'monthly' ? 'yearly' : 'monthly')
          } else {
            emit('select-pro-upgrade', cycle.value)
          }
        }
      },
      {
        key: 'enterprise',
        planTitle: enterprise.label,
        description: enterprise.tagline,
        pricingDetails: enterprise.description,
        showTag: false,
        tagLabel: '',
        value: 'Custom',
        prefix: '',
        suffix: '',
        showPrefix: false,
        showSuffix: false,
        features: enterprise.features,
        buttonLabel: 'Contact Sales',
        buttonKind: 'outlined',
        buttonDisabled: false,
        onAction: () => {
          window.open(props.contactSalesUrl, '_blank')
        }
      }
    ]
  })
</script>
