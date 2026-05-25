<script setup>
  import { computed } from 'vue'
  import CurrentBadge from '@/views/DeploymentVersions/components/CurrentBadge.vue'

  defineOptions({ name: 'deployment-row-cell' })

  const props = defineProps({
    deployment: {
      type: Object,
      required: true
    }
  })

  const environmentLabel = computed(() => {
    const env = props.deployment?.environment
    if (!env) return ''
    return env.charAt(0).toUpperCase() + env.slice(1)
  })
</script>

<template>
  <div class="min-w-0 flex flex-col gap-1">
    <div class="flex min-w-0 items-center gap-2">
      <span
        class="m-0 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-medium leading-6 text-[var(--text-color)]"
        :data-testid="`deployment-row__id-${deployment.id}`"
      >
        {{ deployment.id || '--' }}
      </span>
      <CurrentBadge v-if="deployment.isCurrent" />
    </div>
    <span
      v-if="environmentLabel"
      class="text-xs leading-5 text-[var(--text-color-secondary)]"
    >
      {{ environmentLabel }}
    </span>
  </div>
</template>
