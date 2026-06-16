<script setup>
  import { ref, computed, watch, onMounted } from 'vue'
  import { useField } from 'vee-validate'
  import { useRouter } from 'vue-router'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import MessageCard from '@/components/MessageCard'
  import Dropdown from '@aziontech/webkit/dropdown'
  import PrimeButton from '@aziontech/webkit/button'
  import Tag from '@aziontech/webkit/tag'
  import { environmentService } from '@/services/v2/environment/environment-service'
  import { deploymentService } from '@/services/v2/deployment/deployment-service'
  import { mapPolicyToLabel } from '@/services/v2/deployment/deployment-adapter'

  defineOptions({ name: 'deployment-settings-block' })

  const props = defineProps({
    isDrawer: { type: Boolean, default: false },
    noBorder: { type: Boolean, default: false }
  })

  const router = useRouter()

  const { value: domainsValue } = useField('domains')
  const { value: environmentDeployments, setValue: setEnvironmentDeployments } =
    useField('environmentDeployments')

  const domainList = computed(() => (Array.isArray(domainsValue.value) ? domainsValue.value : []))
  const envDeploymentsState = computed(() => environmentDeployments.value ?? {})

  // Per-environment metadata cache (id → { name, policy, policyLabel }).
  const environmentMap = ref({})

  const ensureEnvironment = async (envId) => {
    if (!envId || environmentMap.value[envId]) return
    try {
      const env = await environmentService.loadEnvironmentService({ id: envId })
      if (env?.id != null) {
        environmentMap.value = {
          ...environmentMap.value,
          [env.id]: {
            name: env.name,
            policy: env.deployment_policy ?? null,
            policyLabel: mapPolicyToLabel(env.deployment_policy)
          }
        }
      }
    } catch {
      // intentionally swallowed: env metadata is non-blocking UX
    }
  }

  const environmentsInUse = computed(() => {
    const seen = new Map()
    for (const domain of domainList.value) {
      const envId = domain?.environment
      if (envId == null) continue
      if (!seen.has(envId)) {
        seen.set(envId, { id: envId, name: environmentMap.value[envId]?.name || 'Environment' })
      }
    }
    return Array.from(seen.values())
  })

  watch(
    domainList,
    async (rows) => {
      for (const row of rows || []) {
        const envId = row?.environment
        if (envId) await ensureEnvironment(envId)
      }
    },
    { immediate: true, deep: true }
  )

  // Deployment options for the inline dropdown. The shared QueryClient defaults to
  // `enabled: false` (queries are driven imperatively across the app), so a reactive
  // useQuery here would never fetch. We call the service directly — it still caches
  // through vue-query's ensureQueryData under the hood.
  const deploymentOptions = ref([])
  const isLoadingDeployments = ref(false)

  const loadDeployments = async () => {
    isLoadingDeployments.value = true
    try {
      const { body } = await deploymentService.listDeploymentsService()
      deploymentOptions.value = Array.isArray(body) ? body : []
    } finally {
      isLoadingDeployments.value = false
    }
  }

  onMounted(loadDeployments)

  const policyLabelFor = (envId) => environmentMap.value[envId]?.policyLabel || ''

  const policyFor = (envId) => environmentMap.value[envId]?.policy ?? null

  // A deployment is compatible only when it shares the environment's deployment policy
  // (single_version ↔ single_version, versioned_urls ↔ versioned_urls). While the
  // environment policy is still unknown, nothing is blocked.
  const isDeploymentCompatible = (envId, deployment) => {
    const policy = policyFor(envId)
    if (!policy) return true
    return deployment?.deployment_policy === policy
  }

  // PrimeVue calls optionDisabled with each option object — curry the env to keep it pure.
  const isOptionDisabledFor = (envId) => (deployment) => !isDeploymentCompatible(envId, deployment)

  const compatibleCountFor = (envId) =>
    deploymentOptions.value.filter((deployment) => isDeploymentCompatible(envId, deployment)).length

  const compatibilityNoteFor = (envId) => {
    const label = policyLabelFor(envId)
    const total = deploymentOptions.value.length
    const compatible = compatibleCountFor(envId)
    const disabled = total - compatible

    if (!label) {
      return `${total} deployment${total === 1 ? '' : 's'} available`
    }

    if (disabled > 0) {
      return `Only ${label} deployments can be linked — ${compatible} compatible, ${disabled} disabled.`
    }

    return `Only ${label} deployments can be linked — ${compatible} compatible.`
  }

  const hasMissingDeployment = computed(() =>
    environmentsInUse.value.some((env) => !envDeploymentsState.value[env.id]?.deploymentId)
  )

  const deploymentIdFor = (envId) => envDeploymentsState.value[envId]?.deploymentId ?? null

  const setDeployment = (envId, deploymentId) => {
    const current = envDeploymentsState.value[envId] || {}
    setEnvironmentDeployments({
      ...envDeploymentsState.value,
      [envId]: { ...current, deploymentId }
    })
  }

  const clearSelection = (envId) => setDeployment(envId, null)

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

        <!-- One card per environment in use -->
        <div
          v-for="env in environmentsInUse"
          :key="env.id"
          class="flex flex-col gap-3 p-4 rounded surface-section border surface-border"
          :data-testid="`deployment-settings__card-${env.id}`"
        >
          <!-- Header: icon · environment · policy badge · clear action -->
          <div class="flex items-center gap-2">
            <i class="pi pi-box text-color-secondary" />
            <span class="text-sm font-medium text-color truncate">{{ env.name }}</span>
            <Tag
              v-if="policyLabelFor(env.id)"
              severity="secondary"
              :value="policyLabelFor(env.id)"
              :data-testid="`deployment-settings__policy-${env.id}`"
            />
            <PrimeButton
              text
              rounded
              size="small"
              icon="pi pi-times"
              class="ml-auto"
              aria-label="Clear deployment"
              :data-testid="`deployment-settings__clear-${env.id}`"
              @click="clearSelection(env.id)"
            />
          </div>

          <!-- Compatibility note -->
          <MessageCard
            type="info"
            :description="compatibilityNoteFor(env.id)"
            :dataTestid="`deployment-settings__compat-${env.id}`"
          />

          <!-- Inline deployment selector -->
          <Dropdown
            :inputId="`deployment-settings__dropdown-${env.id}`"
            :modelValue="deploymentIdFor(env.id)"
            :options="deploymentOptions"
            optionLabel="name"
            optionValue="id"
            :optionDisabled="isOptionDisabledFor(env.id)"
            :loading="isLoadingDeployments"
            placeholder="Select a Deployment"
            emptyMessage="No deployments available"
            appendTo="self"
            :data-testid="`deployment-settings__dropdown-${env.id}`"
            @update:modelValue="setDeployment(env.id, $event)"
          >
            <template #option="{ option }">
              <div class="flex items-center justify-between gap-2 w-full">
                <span class="truncate">{{ option.name }}</span>
                <Tag
                  v-if="option.policyLabel"
                  severity="secondary"
                  :value="option.policyLabel"
                />
              </div>
            </template>
          </Dropdown>
        </div>
      </div>
    </template>
  </form-horizontal>
</template>
