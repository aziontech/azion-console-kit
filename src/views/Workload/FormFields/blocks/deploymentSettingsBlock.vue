<script setup>
  import { ref, computed, watch } from 'vue'
  import { useField } from 'vee-validate'
  import { useRouter } from 'vue-router'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import CollapsibleCard from '@/components/CollapsibleCard'
  import MessageCard from '@/components/MessageCard'
  import LinkDeploymentDrawer from '../components/LinkDeploymentDrawer.vue'
  import PrimeButton from '@aziontech/webkit/button'
  import { environmentService } from '@/services/v2/environment/environment-service'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import { resourcePackTypeMeta } from '@/helpers/deployment-status'
  import { useResourceOptions, toCanonicalResourceKey } from '../helpers/resource-options'

  defineOptions({ name: 'deployment-settings-block' })

  const props = defineProps({
    isDrawer: { type: Boolean, default: false },
    noBorder: { type: Boolean, default: false }
  })

  const router = useRouter()

  const META_BY_KEY = Object.fromEntries(resourcePackTypeMeta.map((meta) => [meta.key, meta]))

  const { optionsForResource, ensureResourceOptions } = useResourceOptions()

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

  // Deployment metadata cache (id → { id, name, allowed_resource_types }).
  const deploymentCache = ref({})
  const deploymentLoading = ref({})

  const ensureDeploymentData = async (deploymentId) => {
    if (deploymentId == null) return
    if (deploymentCache.value[deploymentId] || deploymentLoading.value[deploymentId]) return
    deploymentLoading.value = { ...deploymentLoading.value, [deploymentId]: true }
    try {
      const response = await deploymentService.getDeploymentByIdService(deploymentId)
      const data = response?.data
      if (data?.id != null) {
        deploymentCache.value = {
          ...deploymentCache.value,
          [data.id]: {
            id: data.id,
            name: data.name,
            allowed_resource_types: Array.isArray(data.allowed_resource_types)
              ? data.allowed_resource_types.map(toCanonicalResourceKey)
              : []
          }
        }
      }
    } catch {
      // non-blocking: card body will show fallback values
    } finally {
      deploymentLoading.value = { ...deploymentLoading.value, [deploymentId]: false }
    }
  }

  const deploymentDataFor = (envId) => {
    const deploymentId = envDeploymentsState.value[envId]?.deploymentId ?? null
    if (deploymentId == null) return null
    return deploymentCache.value[deploymentId] ?? null
  }

  // Whenever envDeploymentsState changes, ensure each unique deploymentId is cached
  // and pre-warm resource option lists used by their selected resources.
  watch(
    envDeploymentsState,
    (state) => {
      const seen = new Set()
      for (const envId of Object.keys(state || {})) {
        const entry = state[envId]
        const deploymentId = entry?.deploymentId
        if (deploymentId != null && !seen.has(deploymentId)) {
          seen.add(deploymentId)
          ensureDeploymentData(deploymentId)
        }
        const resources = entry?.resources || {}
        for (const key of Object.keys(resources)) {
          ensureResourceOptions(key)
        }
      }
    },
    { immediate: true, deep: true }
  )

  const hasMissingDeployment = computed(() =>
    environmentsInUse.value.some((env) => !envDeploymentsState.value[env.id]?.deploymentId)
  )

  const resourceLabel = (key) => META_BY_KEY[key]?.label ?? key
  const resourceIcon = (key) => META_BY_KEY[key]?.icon ?? ''

  const resourceNameFor = (envId, key) => {
    const entry = envDeploymentsState.value[envId]?.resources?.[key]
    if (!entry || entry.id == null) return '--'
    const options = optionsForResource(key)
    const match = options.find((option) => option?.id === entry.id)
    return match?.name ?? '--'
  }

  const resourceVersionFor = (envId, key) => {
    const entry = envDeploymentsState.value[envId]?.resources?.[key]
    if (!entry) return 'Latest'
    return entry.version ?? 'Latest'
  }

  // ---- Link drawer state ----
  const drawerVisible = ref(false)
  const drawerTargetEnvId = ref(null)
  const drawerTargetEnvName = ref('')

  const drawerInitialDeploymentId = computed(() => {
    if (drawerTargetEnvId.value == null) return null
    return envDeploymentsState.value[drawerTargetEnvId.value]?.deploymentId ?? null
  })

  const drawerInitialResources = computed(() => {
    if (drawerTargetEnvId.value == null) return {}
    return envDeploymentsState.value[drawerTargetEnvId.value]?.resources ?? {}
  })

  const updateEnvState = (envId, updater) => {
    const current = envDeploymentsState.value[envId] || { deploymentId: null, resources: {} }
    const next = updater({ ...current, resources: { ...(current.resources || {}) } })
    setEnvironmentDeployments({
      ...envDeploymentsState.value,
      [envId]: next
    })
  }

  const openLinkDrawer = (envId) => {
    const env = environmentsInUse.value.find((item) => item.id === envId)
    drawerTargetEnvId.value = envId
    drawerTargetEnvName.value = env?.name ?? ''
    drawerVisible.value = true
  }

  const onLinkSaved = ({ deploymentId, resources }) => {
    const envId = drawerTargetEnvId.value
    if (envId == null) return
    updateEnvState(envId, (state) => ({
      ...state,
      deploymentId,
      resources: { ...(resources || {}) }
    }))
    // Pre-warm option lists for the resources just linked so the card body shows names quickly.
    for (const key of Object.keys(resources || {})) {
      ensureResourceOptions(key)
    }
    if (deploymentId != null) ensureDeploymentData(deploymentId)
    drawerVisible.value = false
  }

  const navigateToDeployments = () => {
    router.push('/deployments')
  }
</script>

<template>
  <form-horizontal
    title="Environments"
    description="Each environment needs Deployment Settings before you can run workloads. Link settings once—routing, security, and custom responses apply everywhere that environment is used."
    :isDrawer="props.isDrawer"
    :noBorder="props.noBorder"
  >
    <template #inputs>
      <div class="flex flex-col gap-3 max-w-3xl w-full">
        <!-- Info banner: always visible -->
        <MessageCard
          type="info"
          title="Start with Deployment Settings"
          description="Deployment Settings centralize the configuration shared across your environments, including applications, firewall policies, and custom pages."
          dataTestid="deployment-settings__info-banner"
        >
          <template #actions>
            <PrimeButton
              text
              size="small"
              label="Manage Deployment Settings"
              data-testid="deployment-settings__manage-button"
              @click="navigateToDeployments"
            />
          </template>
        </MessageCard>

        <!-- Warning banner: only when any env is missing a deployment -->
        <MessageCard
          v-if="hasMissingDeployment"
          type="warning"
          title="Link Deployment Settings to enable workloads"
          dataTestid="deployment-settings__warning-banner"
        />

        <!-- Empty state when no env is in use yet -->
        <div
          v-if="!environmentsInUse.length"
          class="text-color-secondary text-xs"
          data-testid="deployment-settings__empty"
        >
          Add at least one domain to configure a deployment per environment.
        </div>

        <!-- One CollapsibleCard per environment in use -->
        <template
          v-for="env in environmentsInUse"
          :key="env.id"
        >
          <!-- Empty (not yet linked) state -->
          <CollapsibleCard
            v-if="!envDeploymentsState[env.id]?.deploymentId"
            :disableToggle="true"
            :dataTestid="`deployment-settings__card-${env.id}`"
          >
            <template #header>
              <div class="flex items-center gap-4 flex-1 min-w-0">
                <div class="flex flex-col gap-1 flex-1 min-w-0 items-start">
                  <p class="text-xs text-color-secondary m-0">Environment</p>
                  <p class="text-sm text-color m-0 truncate">{{ env.name }}</p>
                </div>
                <div class="flex flex-col gap-1 flex-1 min-w-0 items-start">
                  <p class="text-xs text-color-secondary m-0">Deployment Settings</p>
                  <p class="text-sm text-color m-0">--</p>
                </div>
              </div>
            </template>
            <template #header-actions>
              <PrimeButton
                outlined
                size="small"
                icon="pi pi-plus"
                label="Link Settings"
                :data-testid="`deployment-settings__link-${env.id}`"
                @click="openLinkDrawer(env.id)"
              />
            </template>
          </CollapsibleCard>

          <!-- Configured state -->
          <CollapsibleCard
            v-else
            :disableToggle="false"
            :defaultExpanded="true"
            :dataTestid="`deployment-settings__card-${env.id}`"
          >
            <template #header>
              <div class="flex items-center gap-4 flex-1 min-w-0">
                <div class="flex flex-col gap-1 flex-1 min-w-0 items-start">
                  <p class="text-xs text-color-secondary m-0">Environment</p>
                  <p class="text-sm text-color m-0 truncate">{{ env.name }}</p>
                </div>
                <div class="flex flex-col gap-1 flex-1 min-w-0 items-start">
                  <p class="text-xs text-color-secondary m-0">Deployment Settings</p>
                  <p class="text-sm text-color m-0 truncate">
                    {{ deploymentDataFor(env.id)?.name ?? '--' }}
                  </p>
                </div>
              </div>
            </template>
            <template #header-actions>
              <PrimeButton
                size="small"
                icon="pi pi-pencil"
                outlined
                :data-testid="`deployment-settings__edit-${env.id}`"
                @click.stop="openLinkDrawer(env.id)"
              />
            </template>

            <div
              v-if="deploymentDataFor(env.id)?.allowed_resource_types?.length"
              class="flex flex-wrap gap-2 p-2 border-t surface-border"
            >
              <div
                v-for="key in deploymentDataFor(env.id).allowed_resource_types"
                :key="key"
                class="flex flex-col gap-1 p-3 flex-1 basis-[calc(33.333%-0.5rem)] min-w-[140px]"
              >
                <span
                  class="text-[10px] font-medium uppercase tracking-wider text-color-secondary leading-none"
                >
                  {{ resourceLabel(key) }}
                </span>
                <div class="flex items-center gap-2">
                  <i
                    v-if="resourceIcon(key)"
                    :class="resourceIcon(key)"
                    class="text-xs text-color-secondary"
                  />
                  <span class="text-sm text-color truncate">
                    {{ resourceNameFor(env.id, key) }}
                  </span>
                  <span class="text-xs text-color-secondary shrink-0">
                    · {{ resourceVersionFor(env.id, key) }}
                  </span>
                </div>
              </div>
            </div>
          </CollapsibleCard>
        </template>
      </div>

      <LinkDeploymentDrawer
        v-model:visible="drawerVisible"
        :envId="drawerTargetEnvId"
        :envName="drawerTargetEnvName"
        :initialDeploymentId="drawerInitialDeploymentId"
        :initialResources="drawerInitialResources"
        @save="onLinkSaved"
      />
    </template>
  </form-horizontal>
</template>
