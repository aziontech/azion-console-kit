<script setup>
  import InlineMessage from 'primevue/inlinemessage'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextAddOn from '@/templates/form-fields-inputs/fieldTextAddOn'
  import AmexLogo from '@/assets/svg/credit-card-logos/amex-card.vue'
  import DinersLogo from '@/assets/svg/credit-card-logos/diners-card.vue'
  import DiscoverLogo from '@/assets/svg/credit-card-logos/discover-card.vue'
  import JcbLogo from '@/assets/svg/credit-card-logos/jcb-card.vue' 
  import MastercardLogo from '@/assets/svg/credit-card-logos/mastercard-card.vue'
  import VisaLogo from '@/assets/svg/credit-card-logos/visa-card.vue'
  import { ref, computed } from 'vue'

  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-variables' })

  const { value: name } = useField('name')
  const { value: cardNumber } = useField('cardNumber')
  const { value: securityCode } = useField('securityCode')
  const { value: expirationDate } = useField('expirationDate')

  const cardBrandRecognized = computed(() => cardBrand.value !== '')
  const cardBrand = ref('')
  const cardIcon =  ref('')
  const brandIcons = {
    visa: VisaLogo,
    mastercard: MastercardLogo,
    amex: AmexLogo,
    diners: DinersLogo,
    elo: DiscoverLogo,
    jcb: JcbLogo,
  }
  const testCardNumber = () => {
    const number = cardNumber.value
    const cardPatterns = {
      elo: /^(4011|4312|4389|4514|4576|5041|506699|5067|509|6277|6362|6363|650|651|655)/,
      visa: /^4/,
      mastercard: /^5[1-5]/,
      amex: /^3[47]/,
      diners: /^3(?:0[0-5]|[68])/,
      jcb: /^(?:2131|1800|35\d{3})\d{11}/
    }
    for (const brand in cardPatterns) {
      console.log(cardPatterns[brand].test(number))
      if (cardPatterns[brand].test(number)) {
        cardBrand.value = brand
        cardIcon.value = brandIcons[cardBrand.value]
        console.log()
        return
      }
    }
    cardBrand.value = ''
  }
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="Payment Method"
  >
    <template #inputs>
      <div class="flex flex-wrap gap-6">
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldText
            label="Card Holder Name *"
            name="name"
            :value="name"
          />
        </div>
        <div class="flex flex-col sm:max-w-xs w-full gap-2">
          <FieldTextAddOn
            label="Card Number *"
            @input="testCardNumber"
            name="cardNumber"
            :value="cardNumber"
            data-testid="payment-method-form-card-number"
          >
            <template #addOn>
              <i v-if="!cardBrandRecognized" class="pi pi-credit-card"></i>
              <component v-if="cardBrandRecognized" :is="cardIcon"></component>
            </template>
          </FieldTextAddOn>
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
        <InlineMessage severity="info"
          >This is a sensitive data is handled by a PCI Compliant payment partner.</InlineMessage
        >
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
