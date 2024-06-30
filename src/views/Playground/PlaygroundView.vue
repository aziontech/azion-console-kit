<template>
  <DrawerPaymentMethod ref="drawerRef"/>
</template>

<script setup>
  import DrawerPaymentMethod from '@/views/Billing/PaymentMethod/Drawer'
  import { ref, onMounted } from 'vue'
  const drawerRef = ref('')

  onMounted(async ()=> {
    console.log(drawerRef.value)
    drawerRef.value.openDrawerCreate()
  })
</script>
