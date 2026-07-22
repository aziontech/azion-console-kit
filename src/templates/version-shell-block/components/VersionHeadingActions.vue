<script setup>
  import { computed, ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeButton from '@aziontech/webkit/button'
  import VersionStateBadge from './VersionStateBadge.vue'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import { DEFAULT_CAPABILITY } from '@/composables/versioning/version-capability'
  import { getVersionBarActions } from '@/composables/versioning/version-actions'
  import { VERSION_ACTIONS } from '@/composables/versioning/version-machine'
  import { formatExhibitionDate } from '@/helpers/convert-date'
  import { releaseComposerRouteFromResource } from '@/templates/release-composition/release-composer-route'

  defineOptions({ name: 'version-heading-actions' })

  const props = defineProps({
    resourceContext: {
      type: Object,
      default: null
    },
    deployRoute: {
      type: Object,
      default: null
    }
  })

  const router = useRouter()

  const { state, version, availableActions, disabledActions, dispatch, capability, isDispatching } =
    useVersionContext()

  const cap = computed(() => capability?.value ?? DEFAULT_CAPABILITY)
  const dispatching = computed(() => isDispatching?.value ?? false)

  const actions = computed(() =>
    getVersionBarActions(state.value, cap.value).filter((action) =>
      availableActions.value.includes(action.key)
    )
  )

  const isDisabled = (key) =>
    disabledActions.value.includes(key) ||
    dispatching.value ||
    (key === VERSION_ACTIONS.DEPLOY && !props.resourceContext && !props.deployRoute)

  const openRelease = () => {
    if (props.deployRoute) {
      router.push(props.deployRoute)
      return
    }
    router.push(
      releaseComposerRouteFromResource({
        ...props.resourceContext,
        version: version.value?.id ? { id: version.value.id } : props.resourceContext?.version
      })
    )
  }

  const handleAction = (key) => {
    if (isDisabled(key)) return
    if (key === VERSION_ACTIONS.DEPLOY) return openRelease()
    dispatch(key, {})
  }

  const testIdFor = (key) =>
    key === VERSION_ACTIONS.DEPLOY ? 'version-heading__deploy' : `version-heading__action-${key}`

  defineExpose({ openRelease })

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
</template>
