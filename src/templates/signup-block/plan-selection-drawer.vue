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
        <div
          class="flex items-center gap-1 p-1 bg-[var(--surface-300)] rounded-md w-fit self-center"
        >
          <button
            type="button"
            class="h-[27px] px-3 py-[5px] text-xs leading-5 font-protomono rounded transition-colors"
            :class="
              localBillingCycle === 'monthly'
                ? 'bg-[var(--surface-0)] text-default'
                : 'text-muted hover:text-default'
            "
            @click="localBillingCycle = 'monthly'"
          >
            Monthly
          </button>
          <button
            type="button"
            class="h-[27px] px-3 py-[5px] text-xs leading-5 font-protomono rounded transition-colors"
            :class="
              localBillingCycle === 'yearly'
                ? 'bg-[var(--surface-0)] text-default'
                : 'text-muted hover:text-default'
            "
            @click="localBillingCycle = 'yearly'"
          >
            Yearly
          </button>
        </div>

        <div class="flex gap-3 flex-1 bg-surface-raised">
          <div
            v-for="planOption in planOptions"
            :key="planOption.value"
            class="plan-card rounded-md px-6 pt-6 pb-2 bg-surfaceRaised border surface-border flex flex-col max-h-[478px] justify-between"
          >
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-3 flex-wrap">
                <span class="text-2xl leading-7 font-bold text-default">{{
                  planOption.label
                }}</span>
                <div
                  v-if="planOption.tagLabel"
                  class="h-[26px] px-2 rounded bg-[#8A84EC] flex items-center justify-center"
                >
                  <span class="text-xs font-protomono text-black">{{ planOption.tagLabel }}</span>
                </div>
              </div>

              <p class="text-xs leading-5 text-default">{{ planOption.description }}</p>

              <div class="flex flex-col gap-2">
                <div
                  v-for="(feature, idx) in planOption.features"
                  :key="idx"
                  class="flex items-start gap-[10px]"
                >
                  <i
                    v-if="feature.icon"
                    :class="feature.icon"
                    class="text-base text-primary size-5 flex items-center justify-center shrink-0"
                  />

                  <span
                    :class="
                      feature.icon
                        ? 'text-xs leading-5 text-default'
                        : 'font-protomono font-medium text-[10px] leading-[1.2] uppercase tracking-[0.2px] text-muted'
                    "
                    >{{ feature.label }}</span
                  >
                </div>
              </div>
            </div>

            <div class="flex flex-col gap-4">
              <div class="flex flex-col">
                <div class="pb-2">
                  <span class="text-xs leading-4 font-protomono text-default">started at</span>
                </div>

                <div class="flex items-end">
                  <span class="text-sm leading-5 text-default">$</span>
                  <span class="text-[64px] leading-[56px] font-protomono text-default">
                    {{ getFormattedPrice(planOption.value) }}
                  </span>
                  <span
                    class="text-sm leading-5 text-default"
                    :class="planOption.value === 'hobby' ? 'opacity-50' : ''"
                  >
                    {{ getPriceSuffix(planOption.value) }}
                  </span>
                </div>
              </div>

              <div class="flex pb-4">
                <Button
                  v-if="isCurrentPlanSelection(planOption.value)"
                  outlined
                  disabled
                  class="h-[42px] font-protomono text-sm border-[#FFFFFF14] opacity-50 tracking-[-0.14px]"
                  label="CURRENT PLAN"
                />
                <Button
                  v-else
                  severity="secondary"
                  class="h-[42px] font-protomono text-sm tracking-[-0.14px]"
                  :label="`Choose ${planOption.label.toUpperCase()}`"
                  icon="pi pi-chevron-right"
                  iconPos="left"
                  @click="handleChoosePlan(planOption.value)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Sidebar>
  </Teleport>
</template>

<script setup>
  import { computed, ref, watch } from 'vue'
  import Sidebar from '@aziontech/webkit/sidebar'
  import Button from '@aziontech/webkit/button'

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

  const planOptions = [
    {
      value: 'hobby',
      label: 'Hobby',
      description: 'Start free for personal projects and learning.',
      tagLabel: '',
      features: [
        { label: 'All features available' },
        { label: 'Global infrastructure', icon: 'pi pi-globe' },
        { label: 'Serverless functions', icon: 'pi pi-code' },
        { label: 'Image optimization', icon: 'pi pi-image' },
        { label: 'Storage & SQL database', icon: 'ai ai-store' },
        { label: 'Firewall', icon: 'pi pi-shield' }
      ]
    },
    {
      value: 'pro',
      label: 'Pro',
      description: 'For professional or commercial workloads.',
      tagLabel: 'Popular',
      features: [
        { label: 'All Free features, plus' },
        { label: 'Additional workloads', icon: 'ai ai-workloads' },
        { label: 'Higher application limits', icon: 'pi pi-check-circle' },
        { label: 'Real-time event observability', icon: 'ai ai-observe-pillar' },
        { label: 'Enhanced security features', icon: 'pi pi-shield' },
        { label: 'Technical Support', icon: 'pi pi-question-circle' }
      ]
    }
    // {
    //   value: 'scale',
    //   label: 'Scale',
    //   description: 'For business with advanced requirements.',
    //   tagLabel: 'Popular',
    //   features: [
    //     { label: 'Flexible usage beyond included limits' },
    //     { label: 'Pay only for what you use', icon: 'pi pi-dollar' },
    //     { label: 'Option to commit and save more', icon: 'pi pi-money-bill' },
    //     { label: 'Compliance (PCI DSS, SOC 2/3)', icon: 'pi pi-verified' },
    //     { label: 'Prioritized support', icon: 'pi pi-headphones' },
    //     { label: 'Professional Services Available', icon: 'pi pi-wrench' }
    //   ]
    // }
  ]

  const getPlanData = (planValue) => {
    return props.plans?.find((plan) => plan.sku?.toLowerCase() === planValue.toLowerCase())
  }

  const getFormattedPrice = (planValue) => {
    if (planValue === 'hobby') return '0'

    const plan = getPlanData(planValue)
    if (!plan?.pricings?.length) return '0'

    const selectedPricing =
      plan.pricings.find((pricing) => pricing.periodicity === localBillingCycle.value) ||
      plan.pricings.find((pricing) => pricing.periodicity === 'monthly') ||
      plan.pricings[0]

    const value = Number(selectedPricing?.priceValue || 0)
    return Number.isInteger(value) ? String(value) : value.toFixed(2)
  }

  const getPriceSuffix = (planValue) => {
    if (planValue === 'hobby') return '/forever'
    return '/mo'
  }

  const isCurrentPlanSelection = (planValue) => {
    const isSamePlan = props.currentPlan?.toLowerCase() === planValue.toLowerCase()
    const isSameBillingCycle = props.billingCycle === localBillingCycle.value

    return isSamePlan && isSameBillingCycle
  }

  const handleChoosePlan = (planValue) => {
    emit('select', {
      plan: planValue,
      billingCycle: localBillingCycle.value
    })
    emit('update:visible', false)
  }
</script>

<style scoped>
  .plan-card {
    transition: border-color 0.2s ease;
  }

  .plan-card:hover {
    border-color: var(--border-hover);
  }
</style>
