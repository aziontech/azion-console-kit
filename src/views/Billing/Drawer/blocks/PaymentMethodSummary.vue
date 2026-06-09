<template>
  <div class="border border-[var(--border-muted)] border-solid rounded-md bg-surface">
    <div class="flex items-center justify-between px-6 py-3 border-b border-[var(--border-muted)]">
      <span class="text-base leading-none text-default">Payment Method</span>
    </div>
    <div class="flex flex-col gap-3 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <CardFlagBlock
            v-if="brand"
            :cardFlag="brand"
          />
          <div class="flex flex-col">
            <span class="text-sm font-medium text-default">{{ cardLabel }}</span>
            <span
              v-if="expiration"
              class="text-xs text-muted"
              >Expires {{ expiration }}</span
            >
          </div>
        </div>
        <ActionButton
          v-if="showSwap"
          kind="text"
          size="small"
          icon="pi pi-credit-card"
          label="Use another payment method"
          @click="$emit('swap')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import ActionButton from '@aziontech/webkit/actions/button'
  import CardFlagBlock from '@/templates/card-flag-block'

  defineOptions({ name: 'payment-method-summary' })

  const SUPPORTED_FLAGS = ['visa', 'mastercard', 'amex', 'discover', 'diners', 'jcb']
  const BRAND_ALIASES = {
    american_express: 'amex',
    americanexpress: 'amex',
    diners_club: 'diners',
    dinersclub: 'diners'
  }

  const props = defineProps({
    card: { type: Object, default: null },
    showSwap: { type: Boolean, default: true }
  })

  defineEmits(['swap'])

  const normalizeBrand = (raw) => {
    if (!raw) return null
    const lower = String(raw).toLowerCase()
    const normalized = BRAND_ALIASES[lower] ?? lower
    return SUPPORTED_FLAGS.includes(normalized) ? normalized : null
  }

  const brand = computed(() => {
    const card = props.card
    if (!card) return null
    return normalizeBrand(card.brand ?? card.cardData?.cardBrand)
  })

  const cardLabel = computed(() => {
    const card = props.card
    if (!card) return ''
    const last4 = card.last4 ?? card.cardData?.cardNumber?.replace(/^Ending in\s*/i, '')
    if (!last4) return card.cardData?.cardNumber ?? ''
    const brandLabel = (card.brand ?? card.cardData?.cardBrand ?? '').toString()
    const formattedBrand = brandLabel
      ? brandLabel.charAt(0).toUpperCase() + brandLabel.slice(1)
      : ''
    return [formattedBrand, last4].filter(Boolean).join(' •••• ') || `Ending in ${last4}`
  })

  const expiration = computed(() => {
    const card = props.card
    if (!card) return null
    if (card.cardExpiration?.text) return card.cardExpiration.text
    const month = card.expMonth
    const year = card.expYear
    if (!month || !year) return null
    const mm = String(month).padStart(2, '0')
    const yy = String(year).slice(-2)
    return `${mm}/${yy}`
  })
</script>
