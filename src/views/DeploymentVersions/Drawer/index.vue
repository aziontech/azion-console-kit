<script setup>
  import { computed, ref } from 'vue'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import PrimeButton from '@aziontech/webkit/button'
  import { useToast } from '@aziontech/webkit/use-toast'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsDeploymentVersion from '@/views/DeploymentVersions/FormFields/FormFieldsDeploymentVersion.vue'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import {
    isReadonlyStatus,
    mapStateToStatus
  } from '@/views/DeploymentVersions/helpers/deployment-status'

  const mapFormToCreatePayload = (form) => {
    const kinds = Array.from(
      new Set((form?.resourcePackEntries || []).map((entry) => entry?.kind).filter(Boolean))
    )

    return {
      name: form?.name,
      description: form?.description || null,
      binding_policy: 'STRICT',
      deployment_version_policy: 'single_version',
      allowed_resource_types: kinds,
      strategy_defaults: {
        canary: {
          enabled: Boolean(form?.gradualDeploymentEnabled),
          default_percentage: Number(form?.trafficPercentage ?? 0)
        },
        skew_protection: {
          enabled: Boolean(form?.skewProtectionEnabled),
          default_ttl_seconds: 3600
        }
      }
    }
  }

  const mapFormToPatchPayload = (form) => {
    const payload = mapFormToCreatePayload(form)
    // deployment_version_policy é imutável — API retorna 409 se mudar.
    delete payload.deployment_version_policy
    return payload
  }

  defineOptions({ name: 'deployment-versions-drawer' })

  const emit = defineEmits(['onSuccess'])

  const toast = useToast()
  const showCreateDrawer = ref(false)
  const showEditDrawer = ref(false)
  const selectedDeploymentId = ref('')
  const selectedDeployment = ref(null)

  const DEBOUNCE_TIME_IN_MS = 300
  const loadCreateDrawer = refDebounced(showCreateDrawer, DEBOUNCE_TIME_IN_MS)
  const loadEditDrawer = refDebounced(showEditDrawer, DEBOUNCE_TIME_IN_MS)

  const validationSchema = yup.object({
    name: yup.string().required().label('Name'),
    description: yup.string().nullable().default(''),
    environment: yup
      .string()
      .required()
      .oneOf(['development', 'staging', 'production'])
      .label('Environment'),
    publishDomain: yup.string().nullable().default(''),
    deploymentPolicy: yup
      .string()
      .required()
      .oneOf(['auto-approve', 'manual-approve', 'two-step'])
      .label('Deployment policy'),
    deploymentStrategy: yup
      .string()
      .required()
      .oneOf(['all-at-once', 'rolling', 'blue-green', 'canary'])
      .label('Deployment strategy'),
    gradualDeploymentEnabled: yup.boolean().default(false),
    gradualVersion: yup.string().nullable().default(''),
    trafficPercentage: yup.number().min(0).max(100).default(10),
    skewProtectionEnabled: yup.boolean().default(false),
    resourcePackEntries: yup
      .array()
      .of(
        yup.object({
          kind: yup.string().required().label('Resource type'),
          name: yup.string().required().label('Resource name'),
          hash: yup.string().nullable().default('')
        })
      )
      .min(1, 'Pin at least one resource for this version.')
      .label('Resource versions')
      .default([])
  })

  const initialValues = {
    name: '',
    description: '',
    environment: 'development',
    publishDomain: '',
    deploymentPolicy: 'manual-approve',
    deploymentStrategy: 'all-at-once',
    gradualDeploymentEnabled: false,
    gradualVersion: '',
    trafficPercentage: 10,
    skewProtectionEnabled: false,
    resourcePackEntries: []
  }

  const editStatus = computed(() => {
    const state = selectedDeployment.value?.state
    if (!state) return { content: 'Draft', severity: 'info' }
    return mapStateToStatus(state)
  })
  const editIsReadonly = computed(() => isReadonlyStatus(editStatus.value?.content))
  const editAudit = computed(() => {
    const dep = selectedDeployment.value
    if (!dep) return null

    return {
      buildTriggerType: dep.last_modified_by?.trigger || 'Console',
      triggeredByUser: dep.last_modified_by?.user_id,
      createdAt: dep.updated_at,
      versionId: dep.id,
      auditMetadata: null
    }
  })

  const openCreateDrawer = () => {
    selectedDeployment.value = null
    selectedDeploymentId.value = ''
    showCreateDrawer.value = true
  }

  const openEditDrawer = async (deployment) => {
    const id = typeof deployment === 'object' ? deployment?.id : deployment
    if (!id) return

    selectedDeploymentId.value = String(id)

    try {
      const response = await deploymentService.getDeploymentByIdService(id)
      selectedDeployment.value = response.data
      showEditDrawer.value = true
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Failed to load deployment'
      })
    }
  }

  const loadDeploymentService = async ({ id }) => {
    const response = await deploymentService.getDeploymentByIdService(id)
    const dep = response.data
    selectedDeployment.value = dep

    // Campos legados sem equivalente na API nova ficam com defaults — serão
    // descartados pelos mappers no envio. UX redesign vai eliminá-los.
    return {
      name: dep.name || '',
      description: dep.description || '',
      environment: 'development',
      publishDomain: '',
      deploymentPolicy: 'manual-approve',
      deploymentStrategy: 'all-at-once',
      gradualDeploymentEnabled: Boolean(dep.strategy_defaults?.canary?.enabled),
      gradualVersion: '',
      trafficPercentage: Number(dep.strategy_defaults?.canary?.default_percentage ?? 10),
      skewProtectionEnabled: Boolean(dep.strategy_defaults?.skew_protection?.enabled),
      resourcePackEntries: (dep.allowed_resource_types || []).map((kind) => ({
        kind,
        name: '',
        hash: ''
      }))
    }
  }

  const createDeploymentServiceAdapter = async (payload) => {
    return await deploymentService.createDeploymentService(mapFormToCreatePayload(payload))
  }

  const editDeploymentServiceAdapter = async (payload) => {
    return await deploymentService.updateDeploymentService(
      selectedDeploymentId.value,
      mapFormToPatchPayload(payload)
    )
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
    v-model:visible="showCreateDrawer"
    :createService="createDeploymentServiceAdapter"
    :schema="validationSchema"
    :initialValues="initialValues"
    title="New deployment version"
    @onSuccess="handleSuccess"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDeploymentVersion
        :disabledFields="disabledFields"
        :isEdit="false"
        :readonly="false"
        :status="{ content: 'Draft', severity: 'info' }"
      />
    </template>

    <template #actionBar="{ onSubmit, closeDrawer, isSubmitting }">
      <div
        class="flex w-full items-center justify-end gap-2 border-t border-[var(--surface-border)] bg-[var(--surface-section)] px-6 py-3"
        data-testid="deployment-version-drawer__create-actions"
      >
        <PrimeButton
          label="Cancel"
          severity="secondary"
          outlined
          size="small"
          :disabled="isSubmitting"
          @click="closeDrawer"
          data-testid="deployment-version-drawer__cancel-create"
        />
        <PrimeButton
          label="Save as Draft"
          severity="secondary"
          size="small"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="onSubmit"
          data-testid="deployment-version-drawer__save-draft"
        />
      </div>
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="loadEditDrawer"
    :id="selectedDeploymentId"
    v-model:visible="showEditDrawer"
    :loadService="loadDeploymentService"
    :editService="editDeploymentServiceAdapter"
    :schema="validationSchema"
    title="Edit deployment version"
    @onSuccess="handleSuccess"
  >
    <template #formFields="{ disabledFields }">
      <FormFieldsDeploymentVersion
        :disabledFields="disabledFields"
        :isEdit="true"
        :readonly="editIsReadonly"
        :status="editStatus"
        :audit="editAudit"
      />
    </template>

    <template #action-bar="{ onSubmit, onCancel, loading }">
      <div
        class="flex w-full items-center justify-end gap-2 border-t border-[var(--surface-border)] bg-[var(--surface-section)] px-6 py-3"
        data-testid="deployment-version-drawer__edit-actions"
      >
        <PrimeButton
          :label="editIsReadonly ? 'Close' : 'Cancel'"
          severity="secondary"
          outlined
          size="small"
          :disabled="loading"
          @click="onCancel"
          data-testid="deployment-version-drawer__close-edit"
        />

        <PrimeButton
          v-if="!editIsReadonly"
          label="Save changes"
          severity="secondary"
          size="small"
          :loading="loading"
          @click="onSubmit"
          data-testid="deployment-version-drawer__save-changes"
        />
      </div>
    </template>
  </EditDrawerBlock>
</template>
