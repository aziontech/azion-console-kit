<script setup>
  import { computed, ref, watch } from 'vue'
  import { resourcePackTypeMeta } from '@/views/DeploymentVersions/helpers/deployment-status'
  import { edgeAppService } from '@/services/v2/edge-app/edge-app-service'
  import { edgeFirewallService } from '@/services/v2/edge-firewall/edge-firewall-service'
  import { customPageService } from '@/services/v2/custom-page/custom-page-service'

  defineOptions({ name: 'resources-section' })

  const props = defineProps({
    workload: { type: Object, default: () => null }
  })

  const META_BY_KEY = Object.fromEntries(resourcePackTypeMeta.map((meta) => [meta.key, meta]))

  // Keys currently surfaced by the workload/deployments API (workload-adapter.transformLoadWorkload)
  // TODO: extend as the deployments API starts returning more resources (wafRule, dataStream, ...)
  const ORDERED_KEYS = ['application', 'firewall', 'customPage']

  const RESOURCE_LOADERS = {
    application: ({ id }) => edgeAppService.loadEdgeApplicationService({ id }),
    firewall: ({ id }) => edgeFirewallService.loadEdgeFirewallService({ id }),
    customPage: ({ id }) => customPageService.loadCustomPagesService({ id })
  }

  // TODO: replace with the real value once /workload/deployments returns resource versions
  const MOCK_VERSIONS = {
    application: 'v1.4.2',
    firewall: 'v0.9.1',
    customPage: 'v2.0.0'
  }

  // nested cache: { [key]: { [id]: name } }
  const nameMap = ref({})

  const resolveName = async (key, id) => {
    if (!id) return
    if (nameMap.value[key]?.[id] !== undefined) return
    const loader = RESOURCE_LOADERS[key]
    if (!loader) return
    try {
      const result = await loader({ id })
      const name = result?.name ?? result?.data?.name ?? null
      nameMap.value = {
        ...nameMap.value,
        [key]: { ...(nameMap.value[key] || {}), [id]: name }
      }
    } catch {
      // non-blocking — fall back to id when display
    }
  }

  watch(
    () => props.workload,
    (workload) => {
      if (!workload) return
      for (const key of ORDERED_KEYS) {
        const id = workload[key]
        if (id != null) resolveName(key, id)
      }
    },
    { immediate: true, deep: true }
  )

  const resources = computed(() => {
    if (!props.workload) return []
    return ORDERED_KEYS.map((key) => {
      const id = props.workload[key]
      if (id == null) return null
      const meta = META_BY_KEY[key]
      const resolvedName = nameMap.value[key]?.[id]
      return {
        key,
        label: meta?.label ?? key,
        icon: meta?.icon ?? 'pi pi-cog',
        name: resolvedName || `#${id}`,
        version: MOCK_VERSIONS[key] ?? 'v1.0.0'
      }
    }).filter(Boolean)
  })
</script>

<template>
  <section
    class="border surface-border rounded-md p-4 flex flex-col gap-3"
    data-testid="overview__resources"
  >
    <h3 class="text-sm font-medium m-0">Resources</h3>

    <div
      v-if="!resources.length"
      class="text-xs text-color-secondary"
      data-testid="overview__resources-empty"
    >
      No resources linked to this Workload yet.
    </div>

    <div
      v-else
      class="flex flex-col"
    >
      <div
        v-for="resource in resources"
        :key="resource.key"
        class="flex items-center justify-between py-2 gap-2"
        :data-testid="`overview__resource-${resource.key}`"
      >
        <div class="flex items-center gap-2 min-w-0">
          <i
            :class="resource.icon"
            class="text-color-secondary text-sm shrink-0"
          />
          <span class="text-sm truncate">{{ resource.label }}</span>
        </div>
        <div class="flex flex-col items-end min-w-0 max-w-[60%]">
          <span
            class="text-sm truncate w-full text-right"
            :title="resource.name"
          >
            {{ resource.name }}
          </span>
          <span class="text-xs text-color-secondary">{{ resource.version }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
