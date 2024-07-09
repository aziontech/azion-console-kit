<script setup>
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import * as yup from 'yup'
  import { refDebounced } from '@vueuse/core'
  import { ref } from 'vue'
  import FormFieldsCreateCredit from '../FormFields/FormFieldsCreateCredit'
  import ActionBarBlock from '@/templates/action-bar-block'

  defineOptions({
    name: 'add-credit-drawer'
  })

  const emit = defineEmits(['onSuccess'])

  const props = defineProps({
    cardDefault: {
      type: Object,
      required: true
    },
    createService: {
      type: Function,
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
    amount: yup.number().required()
  })

  const closeCreateDrawer = () => {
    showCreateCreditDrawer.value = false
  }

  const openCreateDrawer = () => {
    showCreateCreditDrawer.value = true
  }

  const handleCreateCredit = () => {
    emit('onSuccess')
    closeCreateDrawer()
  }

  defineExpose({
    openCreateDrawer
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
    title="Add credit to your account"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsCreateCredit
        :cardDefault="props.cardDefault"
        :loading="disabledFields"
      />
    </template>
    <template #actionBar="{ closeDrawer, onSubmit, isSubmitting }">
      <ActionBarBlock
        @onCancel="closeDrawer"
        @onSubmit="onSubmit"
        inDrawer
        primaryActionLabel="Add credit"
        :loading="isSubmitting"
      />
    </template>
  </CreateDrawerBlock>
</template>
