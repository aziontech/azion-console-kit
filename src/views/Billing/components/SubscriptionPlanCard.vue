<template>
  <CardBox
    title="Subscription Plan"
    class="w-full sm:w-1/2"
  >
    <template #header-action>
      <PrimeButton
        outlined
        label="Change Plan"
        class="h-8 px-4 font-protomono text-xs flex items-center justify-center"
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

        <template v-if="subscription.isPro">
          <SubscriptionPlanRow label="Next Charge Date">
            <SkeletonBlock
              :isLoaded="!subscription.isLoading"
              class="text-color"
              elementType="span"
            >
              {{ subscription.nextChargeDate || '--' }}
            </SkeletonBlock>
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Next Charge Value">
            <SkeletonBlock
              :isLoaded="!subscription.isLoading"
              class="text-color"
              elementType="span"
            >
              <span class="text-color">
                <span class="text-color-secondary">$</span>
                {{ nextChargeFormatted }}
              </span>
            </SkeletonBlock>
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Payment Method">
            <SkeletonBlock
              class="text-color"
              width="8rem"
              sizeHeight="small"
              :isLoaded="cardDefault.loader"
              elementType="span"
            >
              <span
                v-if="cardDefault.cardData"
                class="flex gap-2 items-center"
              >
                <CardFlagBlock :cardFlag="cardDefault.cardData.cardBrand" />
                {{ cardDefault.cardData.cardNumber }}
              </span>
              <span v-else>--</span>
            </SkeletonBlock>
          </SubscriptionPlanRow>
        </template>

        <template v-if="subscription.isHobby">
          <SubscriptionPlanRow label="Payment Method">
            <SkeletonBlock
              class="text-color"
              width="8rem"
              sizeHeight="small"
              :isLoaded="cardDefault.loader"
              elementType="span"
            >
              <span
                v-if="cardDefault.cardData"
                class="flex gap-2 items-center"
              >
                <CardFlagBlock :cardFlag="cardDefault.cardData.cardBrand" />
                {{ cardDefault.cardData.cardNumber }}
              </span>
              <span v-else>--</span>
            </SkeletonBlock>
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Payment Currency">
            <span class="text-color">--</span>
          </SubscriptionPlanRow>

          <SubscriptionPlanRow label="Credit Balance">
            <span class="text-color"><span class="text-color-secondary">$</span>0</span>
          </SubscriptionPlanRow>
        </template>
      </div>
    </template>

    <template #footer>
      <p class="w-full text-xs leading-5 text-color-secondary">
        This invoice includes all consumption up to the last day of the month. Change
        <span
          class="text-[var(--text-color-link)] cursor-pointer"
          @click="emit('go-to-payment')"
        >
          payment method.
        </span>
      </p>
    </template>
  </CardBox>
</template>

<script setup>
  import { computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import CardBox from '@aziontech/webkit/card-box'
  import SkeletonBlock from '@/templates/skeleton-block'
  import CardFlagBlock from '@templates/card-flag-block'
  import SubscriptionPlanRow from './SubscriptionPlanRow.vue'

  defineOptions({ name: 'subscription-plan-card' })

  const props = defineProps({
    subscription: { type: Object, required: true },
    cardDefault: { type: Object, default: () => ({ loader: true, cardData: null }) }
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
