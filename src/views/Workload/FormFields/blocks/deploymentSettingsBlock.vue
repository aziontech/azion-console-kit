<script setup>
  import { ref, computed, onMounted, watch } from 'vue'
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

  const environmentMap = ref({})

  const loadEnvironments = async () => {
    try {
      const { body } = await environmentService.listEnvironmentsService()
      const map = {}
      for (const env of body ?? []) {
        if (env?.id == null) continue
        map[String(env.id)] = {
          name: env.name,
          policyLabel: env.deployment_policy ?? ''
        }
      }
      environmentMap.value = map
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
        seen.set(envId, {
          id: envId,
          name: environmentMap.value[String(envId)]?.name || 'Environment'
        })
      }
    }
    return Array.from(seen.values())
  })

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
    await ensureBoundDeploymentsInOptions()
  }

  const ensureBoundDeploymentsInOptions = async () => {
    const boundIds = Object.values(envDeploymentsState.value)
      .map((entry) => entry?.deploymentId)
      .filter(Boolean)

    const missingIds = boundIds.filter(
      (id) => !deploymentOptions.value.some((deployment) => String(deployment.id) === String(id))
    )

    for (const id of missingIds) {
      try {
        const { data } = await deploymentService.getDeploymentByIdService(id)
        if (data?.id != null) {
          deploymentOptions.value = [
            ...deploymentOptions.value,
            { ...data, policyLabel: mapPolicyToLabel(data.deployment_policy) }
          ]
        }
      } catch {
        // intentionally swallowed: keeping the bound deployment visible is best-effort
      }
    }
  }

  watch(envDeploymentsState, () => {
    if (!isLoadingDeployments.value) ensureBoundDeploymentsInOptions()
  })

  onMounted(() => {
    loadEnvironments()
    loadDeployments()
  })

  const policyLabelFor = (envId) => environmentMap.value[String(envId)]?.policyLabel || ''

  const deploymentPolicyLabel = (deployment) =>
    deployment?.policyLabel ?? mapPolicyToLabel(deployment?.deployment_policy)

  const isDeploymentCompatible = (envId, deployment) => {
    const policyLabel = policyLabelFor(envId)
    if (!policyLabel) return true
    return deploymentPolicyLabel(deployment) === policyLabel
  }

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

        <MessageCard
          v-if="hasMissingDeployment"
          type="warning"
          title="Link Deployment Settings to enable workloads"
          dataTestid="deployment-settings__warning-banner"
        />

        <div
          v-if="!environmentsInUse.length"
          class="text-color-secondary text-xs"
          data-testid="deployment-settings__empty"
        >
          Add at least one domain to configure a deployment per environment.
        </div>

        <div
          v-for="env in environmentsInUse"
          :key="env.id"
          class="flex flex-col gap-3 p-4 rounded surface-section border surface-border"
          :data-testid="`deployment-settings__card-${env.id}`"
        >
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

          <MessageCard
            type="info"
            :description="compatibilityNoteFor(env.id)"
            :dataTestid="`deployment-settings__compat-${env.id}`"
          />

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
