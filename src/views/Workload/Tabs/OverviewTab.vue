<script setup>
  import { computed, ref, watch } from 'vue'
  import WorkloadMetricsSection from './sections/WorkloadMetricsSection.vue'
  import DeploymentsListSection from './sections/DeploymentsListSection.vue'
  import ResourcesSection from './sections/ResourcesSection.vue'
  import GroupedList from '@/components/GroupedList'
  import { environmentService } from '@/services/v2/environment/environment-service'

  defineOptions({ name: 'workload-overview-tab' })

  const props = defineProps({
    workloadId: { type: [String, Number], required: true },
    workload: { type: Object, default: () => null }
  })

  const environmentMap = ref({})

  const ensureEnvironmentInfo = async (envId) => {
    if (!envId || environmentMap.value[envId]) return
    try {
      const env = await environmentService.loadEnvironmentService({ id: envId })
      if (env?.id != null) {
        environmentMap.value[env.id] = env.name
      }
    } catch {
      // intentionally swallowed: env label is non-blocking UX
    }
  }

  const environmentName = (envId) => environmentMap.value[envId] ?? ''

  const buildFqdn = (item) => {
    const sub = item?.subdomain ? `${item.subdomain}.` : ''
    return `${sub}${item?.domain ?? ''}`
  }

  const environmentGroups = computed(() => {
    const buckets = new Map()
    const domains = props.workload?.domains ?? []

    for (const domain of domains) {
      // TODO: changes this when the API returns the environement
      const envId = domain?.environment ?? 'Production'
      if (!buckets.has(envId)) buckets.set(envId, [])
      const fqdn = buildFqdn(domain)
      buckets.get(envId).push({
        key: domain?.id ?? `${envId}:${fqdn}`,
        label: fqdn || 'Untitled domain',
        value: fqdn
      })
    }

    return Array.from(buckets.entries()).map(([envId, items]) => ({
      key: envId,
      label: envId === '__unassigned__' ? 'Unassigned' : environmentName(envId) || 'Production',
      items
    }))
  })

  watch(
    () => props.workload?.domains,
    async (domains) => {
      if (!Array.isArray(domains)) return
      for (const domain of domains) {
        const envId = domain?.environment
        if (envId) await ensureEnvironmentInfo(envId)
      }
    },
    { immediate: true, deep: true }
  )
</script>

<template>
  <div class="flex flex-col gap-4 mt-4">
    <WorkloadMetricsSection :workloadId="workloadId" />

    <div class="flex flex-col xl:flex-row gap-4">
      <div class="xl:flex-[3] min-w-0">
        <DeploymentsListSection :workloadId="workloadId" />
      </div>
      <div class="xl:flex-1 flex flex-col gap-4 min-w-0">
        <ResourcesSection :workload="workload" />
        <section
          class="border surface-border rounded-md p-4 flex flex-col gap-4 min-w-0"
          data-testid="overview__environments"
        >
          <h3 class="text-sm font-medium m-0">Environments</h3>
          <div class="min-w-0 overflow-hidden">
            <GroupedList
              :groups="environmentGroups"
              dataTestid="overview__environments-list"
            />
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
