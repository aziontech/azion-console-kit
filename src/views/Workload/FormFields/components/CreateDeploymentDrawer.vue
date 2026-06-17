<script setup>
  import { computed } from 'vue'
  import CreateDrawerBlock from '@/templates/create-drawer-block'
  import FormFieldsDeployment from '@/views/Deployments/FormFields/FormFieldsDeployment.vue'
  import { validationSchema, initialValues } from '@/views/Deployments/Config/validation'
  import { createDeploymentAdapter } from '@/views/Deployments/Config/adapters'

  defineOptions({ name: 'create-deployment-drawer' })

  const props = defineProps({
    visible: { type: Boolean, default: false }
  })

  const emit = defineEmits(['update:visible', 'save', 'cancel'])

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
      if (!value) emit('cancel')
    }
  })

  const onSuccess = (response) => {
    const createdId = response?.data?.id ?? null
    emit('save', createdId)
  }
</script>

<template>
  <CreateDrawerBlock
    v-model:visible="visibleDrawer"
    drawerId="create-deployment-drawer"
    title="Create Deployment Settings"
    :isOverlapped="true"
    :createService="createDeploymentAdapter"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="onSuccess"
  >
    <template #formFields>
      <FormFieldsDeployment />
    </template>
  </CreateDrawerBlock>
</template>
