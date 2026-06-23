<script setup>
  import { computed, ref, onMounted } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import VersionStateBadge from './VersionStateBadge.vue'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import { DEFAULT_CAPABILITY } from '@/composables/versioning/version-capability'
  import { getVersionBarActions } from '@/composables/versioning/version-actions'
  import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'
  import { formatExhibitionDate } from '@/helpers/convert-date'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'

  defineOptions({ name: 'version-heading-actions' })

  // `resourceContext` feeds the DeployDrawerBlock; null (e.g. versioned-only) means
  // no Deploy action and no drawer is mounted.
  const props = defineProps({
    resourceContext: {
      type: Object,
      default: null
    }
  })

  const { state, version, availableActions, disabledActions, dispatch, capability } =
    useVersionContext()

  const cap = computed(() => capability?.value ?? DEFAULT_CAPABILITY)

  // Same source + same availableActions intersection as VersionActionBar, so the
  // heading and the footer toolbar render an identical button set per state.
  const actions = computed(() =>
    getVersionBarActions(state.value, cap.value).filter((action) =>
      availableActions.value.includes(action.key)
    )
  )

  const isDisabled = (key) =>
    disabledActions.value.includes(key) ||
    (key === VERSION_ACTIONS.DEPLOY && !props.resourceContext)

  const isDeployDrawerOpen = ref(false)
  const openDeployDrawer = () => {
    isDeployDrawerOpen.value = true
  }

  // Deploy opens the heading's own drawer; every other action dispatches on the bus.
  const handleAction = (key) => {
    if (isDisabled(key)) return
    if (key === VERSION_ACTIONS.DEPLOY) return openDeployDrawer()
    dispatch(key, {})
  }

  const testIdFor = (key) =>
    key === VERSION_ACTIONS.DEPLOY ? 'version-heading__deploy' : `version-heading__action-${key}`

  // Exposed so the host view can open THIS drawer from the VersionShell footer
  // Deploy action (DEPLOY command-success), unifying both Deploy entrypoints.
  defineExpose({ openDeployDrawer })

  // Guard the teleport until mount: the target (#version-lifecycle-action) lives in
  // the heading and a cached version query can render this slot before it exists.
  const isMounted = ref(false)
  onMounted(() => {
    isMounted.value = true
  })

  const createdAtLabel = computed(() =>
    version.value?.createdAt ? formatExhibitionDate(version.value.createdAt, 'medium') : null
  )
  const author = computed(() => version.value?.lastEditor || null)
  const createdInfo = computed(() => {
    const created = createdAtLabel.value ? `Created ${createdAtLabel.value}` : ''
    const by = author.value ? `by ${author.value}` : ''
    return [created, by].filter(Boolean).join(' · ') || null
  })
</script>

<template>
  <Teleport
    v-if="isMounted"
    to="#version-lifecycle-action"
  >
    <div class="flex flex-col items-end gap-[var(--spacing-2)]">
      <div class="flex items-center gap-[var(--spacing-4)]">
        <VersionStateBadge :state="state" />
        <PrimeButton
          v-for="action in actions"
          :key="action.key"
          :label="action.label"
          :icon="action.icon"
          size="small"
          :outlined="action.emphasis === 'secondary'"
          :severity="action.emphasis === 'secondary' ? 'secondary' : undefined"
          :disabled="isDisabled(action.key)"
          :data-testid="testIdFor(action.key)"
          @click="handleAction(action.key)"
        />
      </div>
      <span
        class="text-body-xs text-[var(--text-color-secondary)]"
        data-sentry-mask
        data-testid="version-heading__version-info"
      >
        {{ createdInfo }}
      </span>
    </div>
  </Teleport>

  <DeployDrawerBlock
    v-if="cap.canDeploy && resourceContext"
    v-model:visible="isDeployDrawerOpen"
    :resource-context="resourceContext"
  />
</template>
