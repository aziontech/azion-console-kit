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
      <div class="flex justify-center">
        <SegmentedButton
          v-model:value="cycle"
          :items="cycleOptions"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PlanComparisonCard
          v-for="card in planCards"
          :key="card.key"
          v-bind="card.props"
          @action="card.onAction"
        />
      </div>
    </div>
  </Sidebar>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import SegmentedButton from '@aziontech/webkit/segmented-button'
  import PlanComparisonCard from './blocks/PlanComparisonCard.vue'
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

  const cycle = ref(props.currentCycle === 'yearly' ? 'yearly' : 'monthly')

  watch(
    () => props.currentCycle,
    (next) => {
      cycle.value = next === 'yearly' ? 'yearly' : 'monthly'
    }
  )

  const cycleOptions = [
    { label: 'Monthly', value: 'monthly' },
    { label: 'Yearly', value: 'yearly' }
  ]

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const proPricing = computed(() => getPlanPricing(props.plans, 'pro'))

  const proPrice = computed(() => {
    const value = cycle.value === 'yearly' ? proPricing.value.yearly : proPricing.value.monthly
    return value ? `$ ${Number(value).toFixed(0)}` : '$ 0'
  })

  const isCurrentHobby = computed(() => props.currentPlan === 'hobby')
  const isCurrentPro = computed(() => props.currentPlan === 'pro')

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
        props: {
          name: hobby.label,
          tagline: hobby.tagline,
          price: 'Free',
          priceUnit: '',
          billingLine: hobby.description,
          sectionTitle: hobby.sectionTitle,
          features: hobby.features,
          buttonLabel: isCurrentHobby.value ? 'Actual plan' : 'Downgrade',
          buttonOutlined: true,
          buttonDisabled: isCurrentHobby.value
        },
        onAction: () => emit('select-downgrade-hobby')
      },
      {
        key: 'pro',
        props: {
          name: pro.label,
          chipLabel: isCurrentPro.value ? 'Current plan' : 'Recommended',
          chipVariant: isCurrentPro.value ? 'current' : 'recommended',
          tagline: pro.tagline,
          price: proPrice.value,
          priceUnit: 'per month',
          billingLine: pro.description,
          sectionTitle: pro.sectionTitle,
          features: pro.features,
          buttonLabel: isCurrentPro.value ? proCycleSwapLabel.value : 'Upgrade',
          highlighted: !isCurrentPro.value
        },
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
        props: {
          name: enterprise.label,
          tagline: enterprise.tagline,
          price: 'Custom',
          billingLine: enterprise.description,
          sectionTitle: enterprise.sectionTitle,
          features: enterprise.features,
          buttonLabel: 'Contact Sales',
          buttonOutlined: true
        },
        onAction: () => {
          window.open(props.contactSalesUrl, '_blank')
        }
      }
    ]
  })
</script>
