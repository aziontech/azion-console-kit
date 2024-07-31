<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import * as yup from 'yup'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'
  import FormFieldsDrawerCredit from '../FormFields/FormFieldsDrawerCredit'
  import ActionBarBlock from '@/templates/action-bar-block'

  defineOptions({
    name: 'add-credit-drawer'
  })

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    createService: {
      type: Function,
      required: true
    },
    cardDefault: {
      type: Object,
      required: true
    }
  })

  const showCreateCreditDrawer = ref(false)
  const debouncedDrawerAnimate = 300

  const showCreateDrawer = refDebounced(showCreateCreditDrawer, debouncedDrawerAnimate)

  const initialValues = ref({
    amount: undefined
  })

  const validationSchema = yup.object({
    amount: yup.number().required().label('Amount')
  })

  const closeCreateDrawer = () => {
    showCreateCreditDrawer.value = false
  }

  const openDrawer = async () => {
    showCreateCreditDrawer.value = true
  }

  const handleCreateCredit = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }

  defineExpose({
    openDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="showCreateDrawer"
    v-model:visible="showCreateCreditDrawer"
    :createService="props.createService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="handleCreateCredit"
    title="Add Credit"
  >
    <template #formFields="{ disabledFields, closeDrawer }">
      <FormFieldsDrawerCredit
        :cardDefault="props.cardDefault"
        :loading="disabledFields"
        :closeDrawer="closeDrawer"
      />
    </template>
    <template #actionBar="{ closeDrawer, onSubmit, isSubmitting }">
      <ActionBarBlock
        @onCancel="closeDrawer"
        @onSubmit="onSubmit"
        inDrawer
        primaryActionLabel="Add Credit"
        :loading="isSubmitting"
      />
    </template>
  </CreateDrawerBlock>
</template>
