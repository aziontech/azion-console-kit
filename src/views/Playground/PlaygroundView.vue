<template>
  <DrawerPaymentMethod ref="drawerRef" :createService="PaymentsService.createCreditCardService"/>
  <div>
    <form @submit.prevent="handleSubmit">
      <div id="card-element"><!-- Stripe Card Element será inserido aqui --></div>
      <button type="submit">Submit Payment</button>
    </form>
  </div>

</template>

<script setup>
  import DrawerPaymentMethod from '@/views/Billing/PaymentMethod/Drawer'
  import * as PaymentsService from '@/services/billing-services'
  import { ref, onMounted, inject } from 'vue'
  const stripePromise = inject('stripe')
  const drawerRef = ref('')

  onMounted(async ()=> {
    console.log(drawerRef.value)
    console.log(stripePromise)
    const stripeClient = await stripePromise
    const payload = {
      name: 'teste',
      cardNumber: '42424242424242',
      expirationDate: '02/27',
      securityCode: '666'
    }
    PaymentsService.createCreditCardService(payload, stripeClient)
    drawerRef.value.openDrawerCreate()
  })
</script>
