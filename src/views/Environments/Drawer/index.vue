<script setup>
  import { ref } from 'vue'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsEnvironment from '@/views/Environments/FormFields/FormFieldsEnvironment.vue'
  import {
    createEnvironmentService,
    updateEnvironmentService,
    getEnvironmentByIdService
  } from '@/services/v2/environment/environment-mock'

  defineOptions({ name: 'environments-drawer' })

  const emit = defineEmits(['onSuccess'])

  const showCreateEnvironmentDrawer = ref(false)
  const showEditEnvironmentDrawer = ref(false)
  const selectedEnvironmentId = ref('')

  const DEBOUNCE_TIME_IN_MS = 300

  const loadCreateDrawer = refDebounced(showCreateEnvironmentDrawer, DEBOUNCE_TIME_IN_MS)
  const loadEditDrawer = refDebounced(showEditEnvironmentDrawer, DEBOUNCE_TIME_IN_MS)

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    status: yup.string().required().oneOf(['active', 'inactive']).label('Status'),
    configuration: yup
      .string()
      .required()
      .oneOf(['single_version', 'versioned_urls'])
      .label('Configuration'),
    globalVariables: yup.array().of(yup.string()).default([]),
    environmentVariables: yup
      .object()
      .label('Environment Variables')
      .default({})
      .test(
        'valid-environment-variables',
        'Environment Variables must be a key/value object with string values',
        (value) => {
          if (!value) return true
          if (typeof value !== 'object' || Array.isArray(value)) return false

          return Object.keys(value).every((key) => {
            const itemValue = value[key]
            return key.trim().length > 0 && typeof itemValue === 'string'
          })
        }
      )
  })

  const initialValues = {
    name: '',
    status: 'active',
    configuration: 'single_version',
    globalVariables: [],
    environmentVariables: {}
  }

  const getStatusValue = (status) => {
    if (typeof status === 'object' && status !== null) {
      return status.content?.toLowerCase() === 'active' ? 'active' : 'inactive'
    }

    return status || 'active'
  }

  const getConfigurationValue = (configuration) => {
    if (typeof configuration === 'object' && configuration !== null) {
      return configuration.content?.toLowerCase().includes('versioned')
        ? 'versioned_urls'
        : 'single_version'
    }

    return configuration || 'single_version'
  }

  const openCreateDrawer = () => {
    showCreateEnvironmentDrawer.value = true
  }

  const openEditDrawer = (id) => {
    if (!id) return

    selectedEnvironmentId.value = id.toString()
    showEditEnvironmentDrawer.value = true
  }

  const normalizeEnvironmentVariables = (environmentVariables) => {
    if (!environmentVariables) return {}

    if (typeof environmentVariables === 'string') {
      try {
        const parsed = JSON.parse(environmentVariables)
        return typeof parsed === 'object' && !Array.isArray(parsed) && parsed !== null ? parsed : {}
      } catch {
        return {}
      }
    }

    if (typeof environmentVariables === 'object' && !Array.isArray(environmentVariables)) {
      return Object.entries(environmentVariables).reduce((acc, [key, value]) => {
        acc[key] = typeof value === 'string' ? value : String(value ?? '')
        return acc
      }, {})
    }

    return {}
  }

  const loadEnvironmentService = async ({ id }) => {
    const response = await getEnvironmentByIdService(id)

    return {
      name: response.data.name,
      status: getStatusValue(response.data.status),
      configuration: getConfigurationValue(response.data.configuration),
      globalVariables: Array.isArray(response.data.globalVariables)
        ? response.data.globalVariables.map((item) => item?.toString())
        : [],
      environmentVariables: normalizeEnvironmentVariables(response.data.environmentVariables)
    }
  }

  const editEnvironmentService = async (payload) => {
    return await updateEnvironmentService(selectedEnvironmentId.value, payload)
  }

  const handleSuccess = () => {
    emit('onSuccess')
  }

  defineExpose({
    openCreateDrawer,
    openEditDrawer
  })
</script>

<template>
  <CreateDrawerBlock
    v-if="loadCreateDrawer"
    v-model:visible="showCreateEnvironmentDrawer"
    :createService="createEnvironmentService"
    :schema="validationSchema"
    :initialValues="initialValues"
    title="Create Environment"
    @onSuccess="handleSuccess"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsEnvironment :disabledFields="disabledFields" />
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="loadEditDrawer"
    :id="selectedEnvironmentId"
    v-model:visible="showEditEnvironmentDrawer"
    :loadService="loadEnvironmentService"
    :editService="editEnvironmentService"
    :schema="validationSchema"
    title="Edit Environment"
    @onSuccess="handleSuccess"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsEnvironment :disabledFields="disabledFields" />
    </template>
  </EditDrawerBlock>
</template>
