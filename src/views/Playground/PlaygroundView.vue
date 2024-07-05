<template>
  <CreatePaymentMethodBlock :createService="PaymentsService.createCreditCardService" v-model:visible="showCreatePaymentMethodDrawer"/>
</template>

<script setup>
  import * as PaymentsService from '@/services/billing-services'
  import CreatePaymentMethodBlock from '@templates/add-payment-method-block'
  import { ref, onMounted, inject } from 'vue'
  const showCreatePaymentMethodDrawer = ref(false)

  onMounted(async () => {
    openDrawerCreate()
  })

  const openDrawerCreate = () => {
    showCreatePaymentMethodDrawer.value = true
  }
</script>

