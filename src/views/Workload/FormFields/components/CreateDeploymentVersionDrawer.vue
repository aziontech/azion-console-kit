<script setup>
  import { computed } from 'vue'
  import CreateDrawerBlock from '@/templates/create-drawer-block'
  import FormFieldsDeploymentVersion from '@/views/Deployments/FormFields/FormFieldsDeploymentVersion.vue'
  import {
    validationSchema,
    buildInitialValues,
    createVersionAdapter
  } from '@/views/Deployments/Config/createVersionValidation'

  defineOptions({ name: 'create-deployment-version-drawer' })

  const props = defineProps({
    visible: { type: Boolean, default: false },
    workload: { type: Object, default: () => ({}) },
    workloadDeploymentId: { type: [String, Number], default: null }
  })

  const emit = defineEmits(['update:visible', 'save', 'cancel'])

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      emit('update:visible', value)
      if (!value) emit('cancel')
    }
  })

  const initialValues = computed(() => buildInitialValues(props.workload))
  const createService = computed(() => createVersionAdapter(props.workloadDeploymentId))

  const onSuccess = (response) => emit('save', response?.data?.id ?? null)
</script>

<template>
  <CreateDrawerBlock
    v-model:visible="visibleDrawer"
    drawerId="create-deployment-version-drawer"
    title="Deploy New Version"
    :isOverlapped="true"
    :createService="createService"
    :schema="validationSchema"
    :initialValues="initialValues"
    @onSuccess="onSuccess"
  >
    <template #formFields>
      <FormFieldsDeploymentVersion />
    </template>
  </CreateDrawerBlock>
</template>
