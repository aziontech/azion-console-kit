<template>
  <CardBox
    title="Upgrade to Pro"
    class="w-full min-[1100px]:w-1/2"
  >
    <template #content>
      <div class="px-6 py-4 flex flex-col gap-4">
        <p class="text-xs leading-5 text-color-secondary">
          Upgrade to unlock higher limits and keep your applications running at scale. Explore
          additional capabilities available with the Pro plan:
        </p>
        <div
          class="grid grid-cols-1 sm:grid-cols-2 sm:grid-rows-4 sm:grid-flow-col gap-x-3 gap-y-2.5"
        >
          <div
            v-for="feature in features"
            :key="feature.title"
            class="flex items-center gap-2.5 text-xs leading-none tracking-[-0.24px] text-default"
          >
            <i class="pi pi-check text-base shrink-0 text-success-check" />
            <span>{{ feature.title }}</span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="w-full flex justify-between items-center gap-4 flex-wrap">
        <p class="text-xs leading-5 text-color-secondary">
          Learn more about
          <a
            :href="pricingAndPlansUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-[var(--text-color-link)]"
            >Pricing and Plans</a
          >.
        </p>
        <PrimeButton
          label="Upgrade to Pro"
          class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
          :loading="props.loading"
          :disabled="props.loading"
          @click="handleUpgradeClick"
        />
      </div>
    </template>
  </CardBox>
</template>

<script setup>
  import PrimeButton from '@aziontech/webkit/button'
  import CardBox from '@aziontech/webkit/card-box'
  import { getPlanFeatures } from '@/templates/checkout-block/helpers/plan-features'

  defineOptions({ name: 'upgrade-to-pro-card' })

  const props = defineProps({
    loading: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['upgrade'])

  const features = getPlanFeatures('pro')

  const pricingAndPlansUrl = 'https://www.azion.com/en/pricing/'

  const handleUpgradeClick = () => {
    if (props.loading) return
    emit('upgrade')
  }
</script>
