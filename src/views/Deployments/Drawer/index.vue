<script setup>
  import { computed, ref } from 'vue'
  import { refDebounced } from '@vueuse/core'
  import * as yup from 'yup'
  import PrimeButton from '@aziontech/webkit/button'
  import { useToast } from '@aziontech/webkit/use-toast'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FormFieldsDeploymentVersion from '@/views/Deployments/FormFields/FormFieldsDeploymentVersion.vue'
  import {
    createDeploymentService,
    updateDeploymentService,
    getDeploymentByIdService,
    buildDeploymentService,
    cancelDeploymentService,
    cloneDeploymentToDraftService,
    reopenDeploymentService
  } from '@/services/v2/deployment/deployment-mock'
  import { normalizeText, isReadonlyStatus } from '@/views/Deployments/helpers/deployment-status'

  defineOptions({ name: 'deployments-drawer' })

  const emit = defineEmits(['onSuccess'])

  const toast = useToast()
  const showCreateDrawer = ref(false)
  const showEditDrawer = ref(false)
  const selectedDeploymentId = ref('')
  const selectedDeployment = ref(null)
  const buildOnCreate = ref(false)

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

  const resourcePackToEntries = (resourcePack) => {
    if (!resourcePack || typeof resourcePack !== 'object') return []
    return Object.entries(resourcePack)
      .filter(([, value]) => value && (value.name || value.hash))
      .map(([kind, value]) => ({
        kind,
        name: value?.name || '',
        hash: value?.hash || ''
      }))
  }

  const entriesToResourcePack = (entries) => {
    if (!Array.isArray(entries)) return {}
    return entries.reduce((acc, entry) => {
      if (!entry?.kind) return acc
      acc[entry.kind] = {
        name: entry.name || '',
        hash: entry.hash || ''
      }
      return acc
    }, {})
  }

  const editStatus = computed(
    () => selectedDeployment.value?.status || { content: 'Draft', severity: 'info' }
  )
  const editStatusText = computed(() => normalizeText(editStatus.value?.content))
  const editIsReadonly = computed(() => isReadonlyStatus(editStatus.value?.content))
  const editAudit = computed(() => {
    const dep = selectedDeployment.value
    if (!dep) return null

    return {
      buildTriggerType: dep.buildTriggerType || 'Console',
      triggeredByUser: dep.lastEditor,
      createdAt: dep.lastModified,
      versionId: dep.hash ? `ver_${dep.hash}` : dep.id,
      auditMetadata: dep.auditMetadata
    }
  })

  const openCreateDrawer = () => {
    selectedDeployment.value = null
    selectedDeploymentId.value = ''
    buildOnCreate.value = false
    showCreateDrawer.value = true
  }

  const openEditDrawer = async (deployment) => {
    const id = typeof deployment === 'object' ? deployment?.id : deployment
    if (!id) return

    selectedDeploymentId.value = String(id)

    try {
      const response = await getDeploymentByIdService(id)
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
    const response = await getDeploymentByIdService(id)
    const dep = response.data
    selectedDeployment.value = dep

    return {
      name: dep.name || '',
      description: dep.description || '',
      environment: dep.environment || 'development',
      publishDomain: dep.publishDomain || '',
      deploymentPolicy: dep.deploymentPolicy || 'manual-approve',
      deploymentStrategy: dep.deploymentStrategy || 'all-at-once',
      gradualDeploymentEnabled: Boolean(dep.gradualDeploymentEnabled),
      gradualVersion: dep.gradualVersion || '',
      trafficPercentage: Number(dep.trafficPercentage ?? 10),
      skewProtectionEnabled: Boolean(dep.skewProtectionEnabled),
      resourcePackEntries: resourcePackToEntries(dep.resourcePack)
    }
  }

  const buildServicePayload = (payload) => {
    const { resourcePackEntries, ...rest } = payload || {}
    return {
      ...rest,
      resourcePack: entriesToResourcePack(resourcePackEntries)
    }
  }

  const createDeploymentServiceAdapter = async (payload) => {
    return await createDeploymentService({
      ...buildServicePayload(payload),
      buildOnCreate: buildOnCreate.value
    })
  }

  const editDeploymentServiceAdapter = async (payload) => {
    return await updateDeploymentService(selectedDeploymentId.value, buildServicePayload(payload))
  }

  const handleSuccess = () => {
    emit('onSuccess')
  }

  const runRowAction = async (action, { successMessage, closeAfter = true }) => {
    if (!selectedDeploymentId.value) return

    try {
      await action(selectedDeploymentId.value)
      toast.add({
        severity: 'success',
        summary: 'Success',
        detail: successMessage
      })
      emit('onSuccess')
      if (closeAfter) {
        showEditDrawer.value = false
      }
    } catch (error) {
      toast.add({
        severity: 'error',
        summary: 'Error',
        detail: error.message || 'Action failed'
      })
    }
  }

  const handleDuplicateAsDraft = () =>
    runRowAction(cloneDeploymentToDraftService, {
      successMessage: 'Deployment cloned to draft successfully'
    })

  const handleCancelBuild = () =>
    runRowAction(cancelDeploymentService, {
      successMessage: 'Deployment build canceled'
    })

  const handleReopenAsDraft = () =>
    runRowAction(reopenDeploymentService, {
      successMessage: 'Deployment reopened as draft'
    })

  const handleBuildDraft = () =>
    runRowAction(buildDeploymentService, {
      successMessage: 'Deployment build started'
    })

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
          :loading="isSubmitting && !buildOnCreate"
          :disabled="isSubmitting"
          @click="
            () => {
              buildOnCreate = false
              onSubmit()
            }
          "
          data-testid="deployment-version-drawer__save-draft"
        />
        <PrimeButton
          label="Build version"
          icon="pi pi-play"
          size="small"
          :loading="isSubmitting && buildOnCreate"
          :disabled="isSubmitting"
          @click="
            () => {
              buildOnCreate = true
              onSubmit()
            }
          "
          data-testid="deployment-version-drawer__build-version"
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
        class="flex w-full items-center justify-between gap-2 border-t border-[var(--surface-border)] bg-[var(--surface-section)] px-6 py-3"
        data-testid="deployment-version-drawer__edit-actions"
      >
        <div class="flex items-center gap-2">
          <PrimeButton
            v-if="editStatusText === 'ready'"
            label="Duplicate as Draft"
            icon="pi pi-clone"
            severity="secondary"
            outlined
            size="small"
            :loading="loading"
            @click="handleDuplicateAsDraft"
            data-testid="deployment-version-drawer__duplicate-draft"
          />
          <PrimeButton
            v-else-if="editStatusText === 'error' || editStatusText === 'canceled'"
            label="Reopen as Draft"
            icon="pi pi-refresh"
            severity="secondary"
            outlined
            size="small"
            :loading="loading"
            @click="handleReopenAsDraft"
            data-testid="deployment-version-drawer__reopen-draft"
          />
        </div>

        <div class="flex items-center gap-2">
          <PrimeButton
            :label="editIsReadonly ? 'Close' : 'Cancel'"
            severity="secondary"
            outlined
            size="small"
            :disabled="loading"
            @click="onCancel"
            data-testid="deployment-version-drawer__close-edit"
          />

          <template v-if="editStatusText === 'draft'">
            <PrimeButton
              label="Save changes"
              severity="secondary"
              size="small"
              :loading="loading"
              @click="onSubmit"
              data-testid="deployment-version-drawer__save-changes"
            />
            <PrimeButton
              label="Build version"
              icon="pi pi-play"
              size="small"
              :loading="loading"
              @click="handleBuildDraft"
              data-testid="deployment-version-drawer__build-draft"
            />
          </template>

          <PrimeButton
            v-else-if="editStatusText === 'building'"
            label="Cancel build"
            icon="pi pi-times"
            severity="danger"
            size="small"
            :loading="loading"
            @click="handleCancelBuild"
            data-testid="deployment-version-drawer__cancel-build"
          />
        </div>
      </div>
    </template>
  </EditDrawerBlock>
</template>
