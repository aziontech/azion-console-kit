<script setup>
  import { computed } from 'vue'
  import CreateDrawerBlock from '@/templates/create-drawer-block'
  import PrimeButton from '@aziontech/webkit/button'
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
    <template #actionBar="{ closeDrawer }">
      <div
        class="flex w-full gap-4 justify-end h-16 items-center border-t surface-border sticky bottom-0 surface-section z-50 px-2 md:px-8"
        data-testid="form-actions-container"
      >
        <div
          class="flex w-full justify-content-end max-w-full 3xl:mx-auto 2xl:px-0"
          data-testid="form-actions-content"
        >
          <div
            class="flex gap-3 self-stretch items-center justify-end w-full"
            data-testid="form-actions-buttons"
          >
            <PrimeButton
              outlined
              type="button"
              label="Cancel"
              data-testid="create-deployment-version__cancel"
              @click="closeDrawer"
            />
            <PrimeButton
              outlined
              type="button"
              label="Save as Draft"
              data-testid="create-deployment-version__save-draft"
            />
            <PrimeButton
              type="button"
              label="Save and Deploy"
              data-testid="create-deployment-version__save-deploy"
            />
          </div>
        </div>
      </div>
    </template>
  </CreateDrawerBlock>
</template>
