<template>
  <CardBox
    title="Subscription Plan"
    class="w-full min-[1100px]:w-1/2"
  >
    <template #header-action>
      <ActionButton
        label="Change Plan"
        kind="outlined"
        size="medium"
        @click="emit('change-plan')"
      />
    </template>

    <template #content>
      <div class="flex flex-col gap-4 px-6 py-4">
        <SkeletonBlock
          sizeHeight="medium"
          width="10rem"
          :isLoaded="isTitleLoaded"
          class="flex items-center gap-3 h-5"
        >
          <span class="text-sm font-semibold leading-5 text-color">{{
            subscription.planTitle
          }}</span>
          <span
            v-if="subscription.planTag"
            class="inline-flex items-center px-2 py-1 rounded-md border border-[var(--surface-border)] bg-[var(--surface-section)] text-xs font-semibold leading-4 text-color"
          >
            {{ subscription.planTag }}
          </span>
        </SkeletonBlock>

        <SubscriptionPlanRow label="Plan Start Date">
          <SkeletonBlock
            :isLoaded="!subscription.isLoading"
            class="text-color"
            elementType="span"
          >
            {{ subscription.planStartDate || '--' }}
          </SkeletonBlock>
        </SubscriptionPlanRow>

        <SubscriptionPlanRow label="Next Charge Date">
          <SkeletonBlock
            :isLoaded="!subscription.isLoading"
            class="text-color"
            elementType="span"
          >
            {{ subscription.isPro ? subscription.nextChargeDate || '--' : '--' }}
          </SkeletonBlock>
        </SubscriptionPlanRow>

        <SubscriptionPlanRow label="Next Charge Amount">
          <SkeletonBlock
            :isLoaded="!subscription.isLoading"
            class="text-color"
            elementType="span"
          >
            <Currency
              v-if="subscription.isPro"
              size="small"
              prefix="$"
              :value="nextChargeFormatted"
              :showSuffix="false"
            />
            <span
              v-else
              class="text-color"
              >--</span
            >
          </SkeletonBlock>
        </SubscriptionPlanRow>

        <SubscriptionPlanRow label="Payment Method">
          <span class="inline-flex items-center gap-2 text-color">
            <CardFlagBlock
              v-if="paymentMethodBrand"
              :cardFlag="paymentMethodBrand"
            />
            {{ paymentMethodLabel }}
          </span>
        </SubscriptionPlanRow>
      </div>
    </template>

    <template #footer>
      <p class="w-full text-xs leading-5 text-color-secondary">
        This invoice includes all usage up to the last day of the month.
      </p>
    </template>
  </CardBox>
</template>

<script setup>
  import { computed } from 'vue'
  import ActionButton from '@aziontech/webkit/button'
  import CardBox from '@aziontech/webkit/content/card-box'
  import Currency from '@aziontech/webkit/content/currency'
  import SkeletonBlock from '@/templates/skeleton-block'
  import SubscriptionPlanRow from './SubscriptionPlanRow.vue'
  import CardFlagBlock from '@/templates/card-flag-block'

  defineOptions({ name: 'subscription-plan-card' })

  const SUPPORTED_FLAGS = ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb']
  const BRAND_ALIASES = {
    american_express: 'amex',
    americanexpress: 'amex',
    diners_club: 'diners',
    dinersclub: 'diners'
  }

  const props = defineProps({
    subscription: { type: Object, required: true },
    paymentMethodLabel: { type: String, default: '--' },
    paymentMethodBrandRaw: { type: String, default: '' }
  })

  const paymentMethodBrand = computed(() => {
    const raw = (props.paymentMethodBrandRaw || '').toLowerCase()
    if (!raw) return null
    const normalized = BRAND_ALIASES[raw] ?? raw
    return SUPPORTED_FLAGS.includes(normalized) ? normalized : null
  })

  const emit = defineEmits(['change-plan', 'go-to-payment'])

  const isTitleLoaded = computed(() => !props.subscription.isLoading)

  const formatAmount = (value) => {
    if (value === null || value === undefined || value === '---' || value === '--') return '--'
    const number = Number(value)
    if (Number.isNaN(number)) return String(value)
    const hasCents = Math.round(number * 100) % 100 !== 0
    return hasCents ? number.toFixed(2) : number.toFixed(0)
  }

  const nextChargeFormatted = computed(() => formatAmount(props.subscription.nextChargeValue))
</script>
