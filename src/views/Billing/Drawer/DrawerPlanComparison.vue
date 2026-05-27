<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    position="right"
    class="!w-full md:!w-[1158px]"
  >
    <template #header>
      <h2 class="text-[17.5px] font-semibold leading-[21px] text-default">Change Plan</h2>
    </template>

    <div class="flex flex-col gap-6 p-6">
      <div
        v-if="showCycleToggle"
        class="flex justify-center"
      >
        <SegmentedButton
          v-model="cycle"
          :options="cycleOptions"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
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
          slotPosition="middle"
        >
          <template #actions>
            <ActionButton
              :label="card.buttonLabel"
              :kind="card.buttonKind"
              size="large"
              :loading="card.buttonLoading"
              :disabled="card.buttonDisabled || isAnyPreparing"
              class="w-full"
              @click="card.onAction"
            />
          </template>

          <div class="flex flex-col gap-2">
            <p
              v-if="card.sectionTitle"
              class="text-xs leading-none text-color-secondary"
            >
              {{ card.sectionTitle }}
            </p>
            <ul class="flex flex-col gap-2">
              <li
                v-for="feature in card.features"
                :key="feature.title"
                class="flex items-center gap-2.5 text-xs leading-none text-color"
              >
                <span
                  v-if="feature.icon"
                  class="inline-flex items-center justify-center size-5 shrink-0"
                >
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
    contactSalesUrl: { type: String, default: 'mailto:sales@azion.com' },
    preparingPlan: { type: String, default: null }
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

  const isAnyPreparing = computed(() => Boolean(props.preparingPlan))

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
        value: 'Free',
        prefix: '',
        suffix: '',
        showPrefix: false,
        showSuffix: false,
        sectionTitle: hobby.sectionTitle,
        features: hobby.features,
        buttonLabel: isCurrentHobby.value ? 'Actual plan' : 'Downgrade',
        buttonKind: 'outlined',
        buttonDisabled: isCurrentHobby.value,
        buttonLoading: props.preparingPlan === 'hobby',
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
        sectionTitle: pro.sectionTitle,
        features: pro.features,
        buttonLabel: isCurrentPro.value ? proCycleSwapLabel.value : 'Upgrade',
        buttonKind: 'primary',
        buttonDisabled: false,
        buttonLoading: props.preparingPlan === 'pro',
        onAction: () => {
          if (isCurrentPro.value) {
            emit('select-cycle-change', props.currentCycle === 'monthly' ? 'yearly' : 'monthly')
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
        sectionTitle: enterprise.sectionTitle,
        features: enterprise.features,
        buttonLabel: 'Contact Sales',
        buttonKind: 'outlined',
        buttonDisabled: false,
        buttonLoading: false,
        onAction: () => {
          window.open(props.contactSalesUrl, '_blank')
        }
      }
    ]
  })
</script>
