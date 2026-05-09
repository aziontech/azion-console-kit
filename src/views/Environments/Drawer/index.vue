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
  const keyRegex = /^[A-Z0-9_]+$/

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    description: yup.string().nullable().default(''),
    active: yup.boolean().required().label('Status'),
    deployment_version_policy: yup
      .string()
      .required()
      .oneOf(['SINGLE_VERSION', 'VERSIONED_URL'])
      .label('Deployment Version Policy'),
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
            return keyRegex.test(key.trim()) && typeof itemValue === 'string'
          })
        }
      )
  })

  const initialValues = {
    name: '',
    description: '',
    active: true,
    deployment_version_policy: 'SINGLE_VERSION',
    globalVariables: [],
    environmentVariables: {}
  }

  const getDeploymentVersionPolicyValue = (deploymentVersionPolicy) => {
    if (Array.isArray(deploymentVersionPolicy) && deploymentVersionPolicy.length > 0) {
      const value = deploymentVersionPolicy[0]
      if (value === 'SINGLE_VERSION' || value === 'VERSIONED_URL') {
        return value
      }
    }

    if (
      deploymentVersionPolicy === 'SINGLE_VERSION' ||
      deploymentVersionPolicy === 'VERSIONED_URL'
    ) {
      return deploymentVersionPolicy
    }

    return 'SINGLE_VERSION'
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
      description: response.data.description ?? '',
      active: Boolean(response.data.active),
      deployment_version_policy: getDeploymentVersionPolicyValue(
        response.data.deployment_version_policy
      ),
      globalVariables: Array.isArray(response.data.globalVariables)
        ? response.data.globalVariables.map((item) => item?.toString())
        : [],
      environmentVariables: normalizeEnvironmentVariables(response.data.environmentVariables)
    }
  }

  const normalizePayloadToEnvironmentContract = (payload) => {
    const deploymentVersionPolicy = getDeploymentVersionPolicyValue(
      payload.deployment_version_policy
    )

    return {
      name: payload.name,
      description: payload.description ?? '',
      active: Boolean(payload.active),
      deployment_version_policy: [deploymentVersionPolicy]
    }
  }

  const createEnvironmentServiceAdapter = async (payload) => {
    const normalized = normalizePayloadToEnvironmentContract(payload)
    return await createEnvironmentService(normalized)
  }

  const editEnvironmentService = async (payload) => {
    const normalized = normalizePayloadToEnvironmentContract(payload)

    return await updateEnvironmentService(selectedEnvironmentId.value, {
      name: normalized.name,
      description: normalized.description,
      active: normalized.active
    })
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
    :createService="createEnvironmentServiceAdapter"
    :schema="validationSchema"
    :initialValues="initialValues"
    title="Create Environment"
    @onSuccess="handleSuccess"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsEnvironment
        :disabledFields="disabledFields"
        :isEdit="false"
      />
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
      <FormFieldsEnvironment
        :disabledFields="disabledFields"
        :isEdit="true"
      />
    </template>
  </EditDrawerBlock>
</template>
