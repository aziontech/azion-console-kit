<script setup>
  import { ref, computed, watch } from 'vue'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import CollapsibleCard from '@/components/CollapsibleCard'
  import CreateDeploymentDrawer from '../components/CreateDeploymentDrawer.vue'
  import PrimeButton from '@aziontech/webkit/button'
  import LabelBlock from '@aziontech/webkit/label'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'
  import { environmentService } from '@/services/v2/environment/environment-service'
  import { resourcePackTypeMeta } from '@/helpers/deployment-status'
  import { mockDeployments, getMockDeployment } from '../helpers/mock-deployments'

  defineOptions({ name: 'deployment-settings-block' })

  const props = defineProps({
    isDrawer: { type: Boolean, default: false },
    noBorder: { type: Boolean, default: false }
  })

  const META_BY_KEY = Object.fromEntries(resourcePackTypeMeta.map((meta) => [meta.key, meta]))

  const noopListService = async () => ({ body: [], count: 0 })
  const noopLoadService = async () => ({ id: null, name: '' })

  const RESOURCE_SERVICES = {
    application: {
      list: edgeAppService.listEdgeApplicationsServiceDropdown,
      load: edgeAppService.loadEdgeApplicationService
    },
    firewall: {
      list: edgeFirewallService.listEdgeFirewallServiceDropdown,
      load: edgeFirewallService.loadEdgeFirewallService
    },
    customPage: {
      list: customPageService.listCustomPagesService,
      load: customPageService.loadCustomPagesService
    },
    function: {
      list: noopListService,
      load: noopLoadService
    }
  }

  const resourceLabel = (key) => META_BY_KEY[key]?.label ?? key

  // Cache de options por resourceKey — carregado sob demanda quando um deployment é selecionado.
  const resourceOptions = ref({})
  const resourceLoading = ref({})

  const ensureResourceOptions = async (key) => {
    if (resourceOptions.value[key] || resourceLoading.value[key]) return
    const listService = RESOURCE_SERVICES[key]?.list
    if (!listService) {
      resourceOptions.value = { ...resourceOptions.value, [key]: [] }
      return
    }
    resourceLoading.value = { ...resourceLoading.value, [key]: true }
    try {
      const response = await listService({ fields: ['id', 'name'], active: true })
      const body = Array.isArray(response?.body) ? response.body : []
      resourceOptions.value = { ...resourceOptions.value, [key]: body }
    } catch {
      resourceOptions.value = { ...resourceOptions.value, [key]: [] }
    } finally {
      resourceLoading.value = { ...resourceLoading.value, [key]: false }
    }
  }

  const optionsForResource = (key) => resourceOptions.value[key] ?? []

  const MOCK_VERSION_OPTIONS = [
    { label: 'Latest', value: 'latest' },
    { label: 'v1.0', value: 'v1.0' },
    { label: 'v0.9', value: 'v0.9' }
  ]

  const { value: domainsValue } = useField('domains')
  const { value: environmentDeployments, setValue: setEnvironmentDeployments } =
    useField('environmentDeployments')

  const domainList = computed(() => (Array.isArray(domainsValue.value) ? domainsValue.value : []))
  const envDeploymentsState = computed(() => environmentDeployments.value ?? {})

  const environmentNameMap = ref({})

  const ensureEnvironmentName = async (envId) => {
    if (!envId || environmentNameMap.value[envId]) return
    try {
      const env = await environmentService.loadEnvironmentService({ id: envId })
      if (env?.id != null) environmentNameMap.value[env.id] = env.name
    } catch {
      // intentionally swallowed: env label is non-blocking UX
    }
  }

  const environmentsInUse = computed(() => {
    const seen = new Map()
    for (const domain of domainList.value) {
      const envId = domain?.environment
      if (envId == null) continue
      if (!seen.has(envId)) {
        seen.set(envId, { id: envId, name: environmentNameMap.value[envId] || 'Environment' })
      }
    }
    return Array.from(seen.values())
  })

  watch(
    domainList,
    async (rows) => {
      for (const row of rows || []) {
        const envId = row?.environment
        if (envId) await ensureEnvironmentName(envId)
      }
    },
    { immediate: true, deep: true }
  )

  const drawerVisible = ref(false)
  const drawerTargetEnvId = ref(null)

  const updateEnvState = (envId, updater) => {
    const current = envDeploymentsState.value[envId] || { deploymentId: null, resources: {} }
    const next = updater({ ...current, resources: { ...(current.resources || {}) } })
    setEnvironmentDeployments({
      ...envDeploymentsState.value,
      [envId]: next
    })
  }

  const selectedDeployment = (envId) => {
    const deploymentId = envDeploymentsState.value[envId]?.deploymentId ?? null
    return deploymentId ? getMockDeployment(deploymentId) : null
  }

  const selectedDeploymentName = (envId) =>
    selectedDeployment(envId)?.name ?? 'No deployment selected'

  const onDeploymentSelected = (envId, deploymentId) => {
    const deployment = getMockDeployment(deploymentId)
    const seededResources = {}
    if (deployment) {
      for (const key of deployment.resourceTypes) {
        seededResources[key] = {
          id: deployment.resources?.[key] ?? null,
          version: 'latest',
          enabled: true
        }
        ensureResourceOptions(key)
      }
    }
    updateEnvState(envId, (state) => ({
      ...state,
      deploymentId,
      resources: seededResources
    }))
  }

  const resourceState = (envId, key) =>
    envDeploymentsState.value[envId]?.resources?.[key] || {
      id: null,
      version: 'latest',
      enabled: true
    }

  const setResourceField = (envId, key, field, value) => {
    updateEnvState(envId, (state) => {
      const existing = state.resources?.[key] || { id: null, version: 'latest', enabled: true }
      return {
        ...state,
        resources: {
          ...state.resources,
          [key]: { ...existing, [field]: value }
        }
      }
    })
  }

  const openCreateDeploymentDrawer = (envId) => {
    drawerTargetEnvId.value = envId
    drawerVisible.value = true
  }

  const onDeploymentCreated = (newDeploymentId) => {
    if (drawerTargetEnvId.value != null) {
      onDeploymentSelected(drawerTargetEnvId.value, newDeploymentId)
    }
    drawerTargetEnvId.value = null
  }
</script>

<template>
  <form-horizontal
    title="Deployment Settings"
    description="Configure the deployment used by each environment. Select an existing deployment or create a new one — the deployment's resources are then bound below."
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  >
    <template #inputs>
      <div
        v-if="!environmentsInUse.length"
        class="text-color-secondary text-xs"
        data-testid="deployment-settings__empty"
      >
        Add at least one domain to configure a deployment per environment.
      </div>

      <div class="flex flex-col gap-3 max-w-3xl w-full">
        <CollapsibleCard
          v-for="env in environmentsInUse"
          :key="env.id"
          :title="env.name"
          :count="selectedDeploymentName(env.id)"
          :defaultExpanded="true"
          :dataTestid="`deployment-settings__card-${env.id}`"
        >
          <div class="flex flex-col gap-2 px-4 py-3 border-t surface-border">
            <LabelBlock
              label="Deployment"
              required
            />
            <FieldDropdown
              :name="`deployment_${env.id}`"
              :value="envDeploymentsState[env.id]?.deploymentId ?? null"
              :options="mockDeployments"
              optionLabel="name"
              optionValue="id"
              placeholder="Select a deployment"
              appendTo="body"
              :data-testid="`deployment-settings__deployment-${env.id}`"
              @update:modelValue="onDeploymentSelected(env.id, $event)"
            >
              <template #footer>
                <div class="p-2">
                  <PrimeButton
                    text
                    size="small"
                    icon="pi pi-plus-circle"
                    label="Create new Deployment"
                    class="w-full whitespace-nowrap flex"
                    :pt="{
                      label: { class: 'w-full text-left' },
                      root: { class: 'p-2' }
                    }"
                    :data-testid="`deployment-settings__create-${env.id}`"
                    @click="openCreateDeploymentDrawer(env.id)"
                  />
                </div>
              </template>
            </FieldDropdown>
          </div>

          <div
            v-if="selectedDeployment(env.id)"
            class="flex flex-col gap-3 px-4 py-3 border-t surface-border"
          >
            <h4 class="text-sm font-medium m-0">Resources</h4>
            <div
              v-for="resourceKey in selectedDeployment(env.id).resourceTypes"
              :key="resourceKey"
              class="flex flex-col gap-1"
            >
              <span
                class="text-[10px] font-medium uppercase tracking-wider text-color-secondary leading-none"
              >
                {{ resourceLabel(resourceKey) }}
              </span>
              <div class="flex gap-2 w-full">
                <FieldDropdown
                  :name="`resource_${env.id}_${resourceKey}`"
                  :options="optionsForResource(resourceKey)"
                  optionLabel="name"
                  optionValue="id"
                  :value="resourceState(env.id, resourceKey).id"
                  appendTo="body"
                  class="flex-1"
                  :placeholder="
                    resourceLoading[resourceKey]
                      ? 'Loading...'
                      : `Select a ${resourceLabel(resourceKey)}`
                  "
                  :emptyMessage="`No ${resourceLabel(resourceKey)} available`"
                  @update:modelValue="setResourceField(env.id, resourceKey, 'id', $event)"
                />
                <FieldDropdown
                  :name="`resource_${env.id}_${resourceKey}_version`"
                  :options="MOCK_VERSION_OPTIONS"
                  optionLabel="label"
                  optionValue="value"
                  appendTo="body"
                  class="w-[140px] shrink-0"
                  :value="resourceState(env.id, resourceKey).version"
                  @update:modelValue="setResourceField(env.id, resourceKey, 'version', $event)"
                />
              </div>
            </div>
          </div>
        </CollapsibleCard>
      </div>

      <CreateDeploymentDrawer
        v-model:visible="drawerVisible"
        @save="onDeploymentCreated"
      />
    </template>
  </form-horizontal>
</template>
