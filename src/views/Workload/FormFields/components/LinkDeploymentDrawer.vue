<script setup>
  import { computed, ref, watch } from 'vue'
  import { useForm } from 'vee-validate'
  import { useQuery, useQueryClient } from '@tanstack/vue-query'
  import EmptyDrawer from '@/templates/empty-drawer'
  import ActionBarBlock from '@/templates/action-bar-block'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import PrimeButton from '@aziontech/webkit/button'
  import ButtonSave from '@aziontech/webkit/button-save'
  import ButtonCancel from '@aziontech/webkit/button-cancel'
  import CreateDeploymentDrawer from './CreateDeploymentDrawer.vue'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import { resourcePackTypeMeta } from '@/helpers/deployment-status'
  import { useResourceOptions, toCanonicalResourceKey } from '../helpers/resource-options'

  defineOptions({ name: 'link-deployment-drawer' })

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    envId: {
      type: [Number, String],
      default: null
    },
    envName: {
      type: String,
      default: ''
    },
    initialDeploymentId: {
      type: [Number, String, null],
      default: null
    },
    initialResources: {
      type: Object,
      default: () => ({})
    }
  })

  const emit = defineEmits(['update:visible', 'save', 'cancel'])

  const META_BY_KEY = Object.fromEntries(resourcePackTypeMeta.map((meta) => [meta.key, meta]))
  const resourceLabel = (key) => META_BY_KEY[key]?.label ?? key

  // Mocked version options used as the version-dropdown source until the real
  // deployment-version API is wired. "Latest" is the default selection.
  const DEFAULT_VERSION_OPTIONS = [
    { name: 'Latest', id: 'latest' },
    { name: 'v1.2.0', id: 'v1.2.0' },
    { name: 'v1.1.0', id: 'v1.1.0' },
    { name: 'v1.0.0', id: 'v1.0.0' }
  ]

  const queryClient = useQueryClient()
  const { optionsForResource, ensureResourceOptions, resourceLoading } = useResourceOptions()

  const cloneResources = (resources) => {
    const source = resources && typeof resources === 'object' ? resources : {}
    return Object.keys(source).reduce((acc, key) => {
      const entry = source[key] || {}
      acc[key] = {
        id: entry.id ?? null,
        version: entry.version ?? null
      }
      return acc
    }, {})
  }

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const title = computed(() =>
    props.envName ? `Link Deployment Settings to ${props.envName}` : 'Link Deployment Settings'
  )

  const { values, setFieldValue, resetForm } = useForm({
    initialValues: {
      deploymentId: props.initialDeploymentId ?? null,
      resources: cloneResources(props.initialResources)
    }
  })

  const previousDeploymentId = ref(props.initialDeploymentId ?? null)

  const deploymentsQueryKey = ['workload', 'link-drawer', 'deployments']
  const deploymentsQuery = useQuery({
    queryKey: deploymentsQueryKey,
    queryFn: () =>
      deploymentService.listDeploymentsService({
        fields: ['id', 'name', 'allowed_resource_types']
      }),
    enabled: computed(() => props.visible)
  })

  const deploymentOptions = computed(() => {
    const body = deploymentsQuery.data.value?.body
    return Array.isArray(body) ? body : []
  })

  const findDeployment = (id) =>
    deploymentOptions.value.find((deployment) => deployment?.id === id) || null

  const selectedDeployment = computed(() => findDeployment(values.deploymentId))

  const resourceKeys = computed(() => {
    const allowed = selectedDeployment.value?.allowed_resource_types
    return Array.isArray(allowed) ? allowed.map(toCanonicalResourceKey) : []
  })

  // TODO: when the deployment-version → resource binding API is finalized, switch back
  // to `deploymentVersionService.listVersionsService(values.deploymentId)` via useQuery.
  // For now, use the mocked DEFAULT_VERSION_OPTIONS so the dropdown always demos the flow.
  const versionOptions = computed(() => DEFAULT_VERSION_OPTIONS)

  const seedResourcesFor = (deployment) => {
    if (!deployment) {
      setFieldValue('resources', {})
      return
    }
    const rawKeys = Array.isArray(deployment.allowed_resource_types)
      ? deployment.allowed_resource_types
      : []
    const keys = rawKeys.map(toCanonicalResourceKey)
    const next = {}
    for (const key of keys) {
      const initial = props.initialResources?.[key] || {}
      const id = initial.id ?? null
      // Default to "Latest" so the version dropdown is pre-selected.
      const version = initial.version ?? 'latest'
      next[key] = { id, version }
      // FieldDropdown registers vee-validate fields by its `name` prop, which
      // takes precedence over our `:value` binding. Mirror the seeded values
      // into those flat field names so the dropdown reflects the selection
      // (not just the placeholder).
      setFieldValue(`resource_${key}`, id)
      setFieldValue(`resource_${key}_version`, version)
      ensureResourceOptions(key)
    }
    setFieldValue('resources', next)
  }

  // Reset form whenever the drawer becomes visible.
  watch(
    () => props.visible,
    (isVisible) => {
      if (!isVisible) return
      const nextDeploymentId = props.initialDeploymentId ?? null
      resetForm({
        values: {
          deploymentId: nextDeploymentId,
          resources: cloneResources(props.initialResources)
        }
      })
      previousDeploymentId.value = nextDeploymentId
      // Pre-warm resource option lists + seed flat dropdown fields for any key
      // already in initialResources (so the dropdowns reflect the saved values
      // — not just the placeholder — on reopen/edit).
      for (const key of Object.keys(props.initialResources || {})) {
        const entry = props.initialResources[key] || {}
        setFieldValue(`resource_${key}`, entry.id ?? null)
        setFieldValue(`resource_${key}_version`, entry.version ?? 'latest')
        ensureResourceOptions(key)
      }
      // If we already have a deployment selected at open time, seed resource
      // shape from the matching deployment (covers reopen with same id, where
      // the deploymentId watcher doesn't fire).
      if (nextDeploymentId != null) {
        const deployment = findDeployment(nextDeploymentId)
        if (deployment) seedResourcesFor(deployment)
      }
    },
    { immediate: true }
  )

  // When deploymentId changes (and differs from the previous), reseed resources.
  watch(
    () => values.deploymentId,
    (newId) => {
      if (newId === previousDeploymentId.value) return
      previousDeploymentId.value = newId
      const deployment = findDeployment(newId)
      seedResourcesFor(deployment)
    }
  )

  // Once the deployments list loads, if we already have a deploymentId but
  // resources are empty, seed them from the matching deployment.
  watch(
    () => deploymentOptions.value,
    (options) => {
      if (!options.length) return
      const currentId = values.deploymentId
      if (currentId == null) return
      const deployment = findDeployment(currentId)
      const currentResources = values.resources || {}
      if (deployment && Object.keys(currentResources).length === 0) {
        seedResourcesFor(deployment)
      }
    }
  )

  const setResourceField = (key, field, value) => {
    const current = values.resources?.[key] || { id: null, version: null }
    const nextResources = {
      ...(values.resources || {}),
      [key]: { ...current, [field]: value }
    }
    setFieldValue('resources', nextResources)
  }

  const resourceValue = (key, field) => values.resources?.[key]?.[field] ?? null

  // Embedded "create new deployment" drawer (stacked on top).
  const createDrawerVisible = ref(false)

  const openCreateDeploymentDrawer = () => {
    createDrawerVisible.value = true
  }

  const onDeploymentCreated = async (newDeploymentId) => {
    createDrawerVisible.value = false
    if (!newDeploymentId) return
    await queryClient.invalidateQueries({ queryKey: deploymentsQueryKey })
    setFieldValue('deploymentId', newDeploymentId)
  }

  const isSaveDisabled = computed(() => {
    if (values.deploymentId == null) return true
    const resources = values.resources || {}
    const keys = resourceKeys.value
    if (!keys.length) return false
    for (const key of keys) {
      const entry = resources[key]
      if (!entry) return true
      if (entry.id == null) return true
      if (entry.version == null || entry.version === '') return true
    }
    return false
  })

  const onSave = () => {
    if (isSaveDisabled.value) return
    emit('save', {
      deploymentId: values.deploymentId,
      resources: cloneResources(values.resources)
    })
    emit('update:visible', false)
  }

  const onCancel = () => {
    emit('cancel')
    emit('update:visible', false)
  }
</script>

<template>
  <EmptyDrawer
    v-model:visible="visibleDrawer"
    :title="title"
    :isOverlapped="false"
  >
    <template #content>
      <div
        class="w-full flex flex-col gap-6"
        data-testid="link-deployment-drawer__content"
      >
        <p class="text-sm text-color m-0 leading-snug">
          Choose the Deployment Settings bundle for this environment. Application, Firewall, and
          Custom Pages will apply to this Workload.
        </p>

        <FieldDropdown
          name="deploymentId"
          label="Deployment Settings"
          required
          :options="deploymentOptions"
          optionLabel="name"
          optionValue="id"
          :value="values.deploymentId"
          :loading="deploymentsQuery.isLoading.value"
          placeholder="Select an option"
          emptyMessage="No deployments available"
          appendTo="self"
          data-testid="link-deployment-drawer__deployment-field"
          @update:modelValue="setFieldValue('deploymentId', $event)"
        >
          <template #footer>
            <div class="p-2">
              <PrimeButton
                text
                size="small"
                icon="pi pi-plus-circle"
                label="Create new Deployment Settings"
                class="w-full whitespace-nowrap flex"
                :pt="{
                  label: { class: 'w-full text-left' },
                  root: { class: 'p-2' }
                }"
                data-testid="link-deployment-drawer__create-deployment-button"
                @click="openCreateDeploymentDrawer"
              />
            </div>
          </template>
        </FieldDropdown>

        <div class="h-px w-full bg-[var(--border-color)] surface-border" />

        <span
          class="text-xs font-medium uppercase tracking-[0.24px] text-color-secondary leading-none"
        >
          Deployment Resources
        </span>

        <div
          v-if="selectedDeployment && resourceKeys.length"
          class="flex flex-col gap-6"
        >
          <div
            v-for="key in resourceKeys"
            :key="key"
            class="flex gap-2 w-full items-start"
          >
            <FieldDropdown
              :name="`resource_${key}`"
              :label="resourceLabel(key)"
              required
              :options="optionsForResource(key)"
              optionLabel="name"
              optionValue="id"
              :value="resourceValue(key, 'id')"
              :loading="resourceLoading[key]"
              :placeholder="resourceLoading[key] ? 'Loading...' : 'Select an option'"
              :emptyMessage="`No ${resourceLabel(key)} available`"
              appendTo="self"
              class="flex-1 min-w-0"
              :data-testid="`link-deployment-drawer__resource-${key}`"
              @update:modelValue="setResourceField(key, 'id', $event)"
            />
            <FieldDropdown
              :name="`resource_${key}_version`"
              label="Version"
              required
              :options="versionOptions"
              optionLabel="name"
              optionValue="id"
              :value="resourceValue(key, 'version')"
              appendTo="self"
              class="flex-1 min-w-0"
              :data-testid="`link-deployment-drawer__resource-${key}-version`"
              @update:modelValue="setResourceField(key, 'version', $event)"
            />
          </div>
        </div>
      </div>

      <CreateDeploymentDrawer
        v-model:visible="createDrawerVisible"
        @save="onDeploymentCreated"
      />
    </template>

    <template #footer>
      <ActionBarBlock
        :inDrawer="true"
        primaryActionLabel="Link Settings"
        :loading="false"
        :cancelDisabled="false"
        @onSubmit="onSave"
        @onCancel="onCancel"
      >
        <ButtonCancel
          label="Cancel"
          data-testid="link-deployment-drawer__cancel-button"
          @click="onCancel"
        />
        <ButtonSave
          label="Link Settings"
          :disabled="isSaveDisabled"
          data-testid="link-deployment-drawer__save-button"
          @click="onSave"
        />
      </ActionBarBlock>
    </template>
  </EmptyDrawer>
</template>
