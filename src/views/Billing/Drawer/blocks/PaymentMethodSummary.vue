<template>
  <div class="border border-[var(--surface-border)] rounded-md">
    <div
      class="flex items-center justify-between px-6 py-3 border-b border-[var(--surface-border)]"
    >
      <span class="text-lg font-semibold text-color">Payment Method</span>
    </div>
    <div class="flex flex-col gap-3 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <CardFlagBlock
            v-if="brand"
            :cardFlag="brand"
          />
          <div class="flex flex-col">
            <span class="text-sm font-medium text-color">{{ cardLabel }}</span>
            <span
              v-if="expiration"
              class="text-xs text-color-secondary"
              >Expires {{ expiration }}</span
            >
          </div>
        </div>
        <ActionButton
          kind="text"
          size="small"
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

  const props = defineProps({
    card: { type: Object, default: null }
  })

  defineEmits(['swap'])

  const brand = computed(() => props.card?.cardData?.cardBrand ?? null)
  const cardLabel = computed(() => props.card?.cardData?.cardNumber ?? '')
  const expiration = computed(() => props.card?.cardExpiration?.text ?? null)
</script>
