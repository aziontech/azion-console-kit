<template>
  <div
    class="w-full p-3 surface-border border rounded-md flex flex-col gap-4 justify-between items-center sm:flex-row sm:p-6 lg:gap-10 mt-8"
  >
    <div class="flex gap-3 items-center">
      <div>
        <Avatar
          icon="pi pi-dollar"
          size="large"
          class="bg-opacity-20 min-w-[2rem]"
        />
      </div>

      <div class="flex flex-col">
        <h4 class="text-lg font-bold">The Free Trial credit balance is running low</h4>
        <p class="text-color-secondary w-full max-w-screen-lg sm:max-w-6xl text-sm">
          <slot
            name="textNotification"
            :text="textDisclaimer"
          >
            {{ textDisclaimer }}
            <PrimeButton
              label="payment methods."
              link
              class="p-0 text-sm"
              @click="clickLinkPaymentMethod"
            />
          </slot>
        </p>
      </div>
    </div>
    <div class="flex gap-3">
      <PrimeButton
        class="w-full min-w-max"
        icon="pi pi-plus"
        label="Add Credit"
        @click="props.clickAddCredit"
        outlined
        v-if="props.showBtnAddCredit"
      />
      <PrimeButton
        class="w-full min-w-max"
        icon="pi pi-plus"
        severity="secondary"
        @click="props.clickAddPaymentMethod"
        label="Add Payment Method"
        v-if="props.showBtnAddPaymentMethod"
      />
    </div>
  </div>
</template>
<script setup>
  import Avatar from 'primevue/avatar'
  import PrimeButton from 'primevue/button'
  import { useAccountStore } from '@/stores/account'
  import { ref } from 'vue'

  defineOptions({
    name: 'notification-payment'
  })

  const user = useAccountStore().accountData

  const props = defineProps({
    clickAddCredit: Function,
    clickAddPaymentMethod: Function,
    clickLinkPaymentMethod: Function,
    showBtnAddCredit: {
      type: Boolean,
      default: true
    },
    showBtnAddPaymentMethod: {
      type: Boolean,
      default: true
    }
  })

  const textDisclaimer = ref(user.disclaimer)
  textDisclaimer.value = textDisclaimer.value
    .replace(/^Welcome to your trial period\. |<[^>]*>[^<]*<\/[^>]*>./g, '')
    .replace(/\bpayment method\b/i, '')
    .trim()
</script>
