<template>
  <CreateDrawerBlock
    v-if="loadCreatePaymentMethodDrawer"
    v-model:visible="showCreatePaymentMethodDrawer"
    :createService="props.createService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handlePaymentAdded"
    :showBarGoBack="true"
    title="Create Instance"
  >
    <template #formFields>
      <FormFieldsPaymentMethod />
    </template>
  </CreateDrawerBlock>
</template>

<script setup>
  import { ref, onMounted } from 'vue'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import FormFieldsPaymentMethod from '@views/Billing/PaymentMethod/FormFields/FormFieldsPaymentMethod'
  import { refDebounced } from '@vueuse/core'

  defineOptions({ name: 'drawer-payment-methodß' })

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    createService: {
      type: Function,
      required: true
    }
  })
  const showCreatePaymentMethodDrawer = ref(false)
  const debouncedDrawerAnimate = 300
  const loadCreatePaymentMethodDrawer = refDebounced(
    showCreatePaymentMethodDrawer,
    debouncedDrawerAnimate
  )
  const validationSchema = yup.object({
    name: yup.string().required().label('Card Holder Name'),
    cardNumber: yup.string().required().label('Card Number'),
    securityCode: yup.string().required().label('Security Code (CVC)'),
    expirationDate: yup.string().required().label('Expiration Date')
  })

  onMounted(async () => {})

  const openDrawerCreate = () => {
    showCreatePaymentMethodDrawer.value = true
  }

  const closeDrawerCreate = () => {
    showCreatePaymentMethodDrawer.value = false
  }

  const handlePaymentAdded = () => {
    closeDrawerCreate()
    emit('onSuccess')
  }

  defineExpose({
    openDrawerCreate
  })
</script>
