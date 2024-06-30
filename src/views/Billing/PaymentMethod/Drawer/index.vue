<template>
    <CreateDrawerBlock
      v-if="loadCreatePaymentMethodDrawer"
      v-model:visible="showCreatePaymentMethodDrawer"
      :createService="props.createFunctionService"
      :schema="validationSchema"
      :initialValues="initialValues"
      @onSuccess="handlePaymentAdded"
      :showBarGoBack="true"
      title="Create Instance"
    >
      <template #formFields>
        <FormFieldsPaymentMethod/>
      </template>
    </CreateDrawerBlock>
  </template>
  
  <script setup>
    import { ref, onMounted, computed, inject } from 'vue'
    import * as yup from 'yup'
    import CreateDrawerBlock from '@templates/create-drawer-block'
    import FormFieldsPaymentMethod from '@views/Billing/PaymentMethod/FormFields/FormFieldsPaymentMethod'
    import { refDebounced } from '@vueuse/core'
  
    defineOptions({ name: 'drawer-payment-methodß' })
  
    const emit = defineEmits(['onSuccess'])
  
    const props = defineProps({
    })  
    const showCreatePaymentMethodDrawer = ref(false)
    const debouncedDrawerAnimate = 300
    const loadCreatePaymentMethodDrawer = refDebounced(showCreatePaymentMethodDrawer, debouncedDrawerAnimate)
  
    const validationSchema = yup.object({
      name: yup.string().required().label('Name'),
      edgeFunctionID: yup.number().required()
    })
  
    onMounted(async () => {
    })
  
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
      openDrawerCreate,
    })
  </script>
  