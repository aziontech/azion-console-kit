<script setup>
  import { computed, ref, onMounted } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import VersionStateBadge from './VersionStateBadge.vue'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import { VERSION_ACTIONS, VERSION_STATES } from '@/composables/versioning/version-machine'
  import { formatExhibitionDate } from '@/helpers/convert-date'
  import DeployDrawerBlock from '@/templates/deploy-drawer-block'

  defineOptions({ name: 'version-heading-actions' })

  // `resourceContext` is the only resource-specific input: it feeds the
  // DeployDrawerBlock. When null (e.g. Workload), the Deploy button never shows
  // and no drawer is mounted — only StatusTag / Build / created info.
  const props = defineProps({
    resourceContext: {
      type: Object,
      default: null
    }
  })

  const { state, version, disabledActions, dispatch } = useVersionContext()

  const showBuild = computed(() => state.value === VERSION_STATES.DRAFT)

  // Deploy stays visible across states (set 2 mockup) and only enables on a
  // deployable, built version with a resource context to feed the drawer.
  const isDeployable = computed(() =>
    [VERSION_STATES.READY, VERSION_STATES.ACTIVE].includes(state.value)
  )
  const isDeployDisabled = computed(() => !isDeployable.value || !props.resourceContext)

  const isBuildDisabled = computed(() =>
    disabledActions.value.includes(VERSION_ACTIONS.SAVE_AND_BUILD)
  )

  const handleBuild = () => dispatch(VERSION_ACTIONS.SAVE_AND_BUILD, {})

  const isDeployDrawerOpen = ref(false)
  const openDeployDrawer = () => {
    isDeployDrawerOpen.value = true
  }

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
    <div class="flex flex-col items-end gap-2">
      <div class="flex items-center gap-4">
        <VersionStateBadge :state="state" />
        <PrimeButton
          v-if="showBuild"
          label="Build"
          icon="pi pi-code"
          size="small"
          outlined
          severity="secondary"
          :disabled="isBuildDisabled"
          data-testid="version-heading__build"
          @click="handleBuild"
        />
        <PrimeButton
          label="Deploy"
          icon="pi pi-cloud-upload"
          size="small"
          :disabled="isDeployDisabled"
          data-testid="version-heading__deploy"
          @click="openDeployDrawer"
        />
      </div>
      <span
        class="text-xs text-[var(--text-color-secondary)]"
        data-sentry-mask
        data-testid="version-heading__version-info"
      >
        {{ createdInfo }}
      </span>
    </div>
  </Teleport>

  <DeployDrawerBlock
    v-if="resourceContext"
    v-model:visible="isDeployDrawerOpen"
    :resource-context="resourceContext"
  />
</template>
