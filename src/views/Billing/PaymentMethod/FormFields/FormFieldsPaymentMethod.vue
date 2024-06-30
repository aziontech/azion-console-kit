<script setup>
  import InlineMessage from 'primevue/inlinemessage';
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import { ref } from 'vue'

  import InputText from 'primevue/inputtext'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-variables' })

  const { value: name} = useField('name')
  const { value: cardNumber } = useField('cardNumber')

  const cardBrand = ref('')
  const testCardNumber = () => {
    const number = cardNumber.value

    const cardPatterns = {
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      elo: /^(4011|4312|4389|4514|4576|5041|506699|5067|509|6277|6362|6363|650|651|655)/,
      hipercard: /^(606282|3841(00|4[0,4,6]0)|60)/,
      aura: /^50/,
      diners: /^3(?:0[0-5]|[68])/
    };
    console.log(cardNumber.value)
    for (const brand in cardPatterns) {
      console.log(cardPatterns[brand].test(number))
      if (cardPatterns[brand].test(number)) {
        console.log('aqui')
        cardBrand.value = brand.charAt(0).toUpperCase() + brand.slice(1);
        break;
      }
    }
  }
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="Payment Method"
  >
    <template #inputs>
      {{ cardBrand }}
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldText
            label="Card Holder Name *"
            name="name"
            :value="name"
          />
        </div>
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldText
            label="Card Number *"
            @input="testCardNumber"
            name="cardNumber"
            :value="cardNumber"
            data-testid="payment-method-form-card-number"
          />
        </div>
      </div>

      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldText
            label="Expiration Date *"
            name="name"
            placeholder="MM/YY"
            :value="expirationDate"
          />
        </div>
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldText
            label="Security Code (CVC) *"
            name="name"
            placeholder="CVC"
            :value="securityCode"
          />
        </div>
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <InlineMessage severity="info">This is a sensitive data is handled by a PCI Compliant payment partner.</InlineMessage>
      </div>
      <div class="flex gap-3 items-center">
        <FieldSwitchBlock
          nameField="secret"
          name="secret"
          auto
          :isCard="false"
          title="Set as default"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
