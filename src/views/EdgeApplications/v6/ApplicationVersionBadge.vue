<script setup>
  /**
   * Version state badge for the v6 EditView header.
   *
   * Lives in its own component (and is mounted with `:key="versionId"` in the
   * consumer) because the service's canonical query uses a static queryKey —
   * remounting the component is what renews the subscription when the route
   * switches version in-place (e.g. post-NEW_DRAFT_FROM navigation).
   */
  import { computed } from 'vue'
  import VersionStateBadge from '@/templates/version-shell-block/components/VersionStateBadge.vue'
  import { edgeAppVersionService } from '@/services/v2/edge-app/edge-app-version-service'

  defineOptions({ name: 'application-version-badge' })

  const props = defineProps({
    resourceId: {
      type: [String, Number],
      required: true
    },
    versionId: {
      type: String,
      required: true
    }
  })

  // Same canonical query consumed by VersionShell — vue-query dedupes by
  // queryKey, so badge and shell share a single request.
  const versionQuery = edgeAppVersionService.useLoadVersionQuery(props.resourceId, props.versionId)
  const state = computed(() => versionQuery.data.value?.state ?? null)
</script>

<template>
  <VersionStateBadge
    v-if="state"
    :state="state"
  />
</template>
