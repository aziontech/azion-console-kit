<template>
  <div class="border border-default border-solid rounded-md bg-surface">
    <div class="flex items-center justify-between px-6 py-3 border-b border-default">
      <span class="text-lg font-semibold text-default">Payment Method</span>
    </div>

    <div class="flex flex-col gap-8 p-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div class="flex flex-col gap-2 w-full">
          <FieldInput
            name="cardHolderName"
            label="Card Holder Name"
            required
            :value="cardHolderName"
            placeholder="John Doe"
            class="w-full"
            @input="cardHolderName = $event"
          />
        </div>

        <div class="flex flex-col gap-2 w-full">
          <FieldInput
            name="cardNumber"
            label="Card Number"
            required
            :value="cardNumber"
            placeholder="1234 1234 1234 1234"
            class="w-full"
            @input="cardNumber = $event"
          />
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div class="flex flex-col gap-2 w-full">
          <FieldInput
            name="expirationDate"
            label="Expiration Date"
            required
            :value="expirationDate"
            placeholder="MM / YY"
            class="w-full"
            @input="expirationDate = $event"
          />
        </div>

        <div class="flex flex-col gap-2 w-full">
          <FieldInput
            name="securityCode"
            label="Security Code (CVC/CVV)"
            required
            :value="securityCode"
            placeholder="123"
            class="w-full"
            @input="securityCode = $event"
          />
        </div>
      </div>

      <div
        class="flex items-center gap-3 rounded-md px-4 py-2 bg-[rgba(166,166,166,0.16)] text-default"
      >
        <i class="pi pi-exclamation-circle text-xs" />
        <p class="text-xs leading-4">
          Sensitive data is handled by a PCI-compliant payment partner.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import FieldInput from '@aziontech/webkit/field-text'

  defineOptions({
    name: 'payment-method-block'
  })

  const cardHolderName = ref('')
  const cardNumber = ref('')
  const expirationDate = ref('')
  const securityCode = ref('')

  const paymentMethod = computed(() => ({
    cardHolderName: cardHolderName.value,
    cardNumber: cardNumber.value,
    expirationDate: expirationDate.value,
    securityCode: securityCode.value
  }))

  defineExpose({
    paymentMethod
  })
</script>

<style scoped>
  :deep(.text-base) {
    font-size: 12px !important;
  }
</style>
