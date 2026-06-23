<script setup>
  import { computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/prime-tag'
  import VersionStateBadge from './VersionStateBadge.vue'
  import { isImmutable, isEditable } from '@/composables/versioning/version-machine'
  import { useVersionContext } from '@/composables/versioning/use-version-context'
  import { DEFAULT_CAPABILITY } from '@/composables/versioning/version-capability'
  import { getVersionBarActions } from '@/composables/versioning/version-actions'

  defineOptions({ name: 'version-action-bar' })

  const props = defineProps({
    state: {
      type: String,
      required: true
    },
    availableActions: {
      type: Array,
      required: true
    },
    disabledActions: {
      type: Array,
      required: false,
      default: () => []
    }
  })

  const emit = defineEmits(['dispatch', 'cancel'])

  // Per-state banner COPY only (icon/title/subtitle). The action buttons come from
  // the shared getVersionBarActions so the footer and heading never diverge.
  const BANNER = {
    draft: {
      icon: 'pi pi-file-edit',
      title: 'Editing version',
      subtitle: 'This version is open for editing. Build it to publish an immutable version.'
    },
    building: {
      icon: 'pi pi-spin pi-spinner',
      title: 'Building version',
      subtitle: 'This version is being built. You can cancel while it runs.'
    },
    ready: {
      icon: 'pi pi-check-circle',
      title: 'Viewing a Ready version',
      subtitle:
        'This version is read-only. Create a new version to make changes, or deploy it to go live.',
      // versioned-only resources never deploy: drop the Deploy mention from the copy.
      subtitleVersionedOnly: 'This version is read-only. Create a new version to make changes.'
    },
    active: {
      icon: 'pi pi-check-circle',
      title: 'Viewing a Deployed version',
      subtitle:
        'This version has been deployed and is read-only. Create a new version to make changes.'
    },
    archived: {
      icon: 'pi pi-inbox',
      title: 'Viewing an Archived version',
      subtitle: 'This version is archived and read-only. Create a new version to make changes.'
    },
    queued: {
      icon: 'pi pi-spin pi-spinner',
      title: 'Queued to build',
      subtitle: 'This version is queued and will build shortly. You can cancel while it waits.'
    },
    canceled: {
      icon: 'pi pi-file-edit',
      title: 'Build canceled',
      subtitle: 'The build was canceled. This version is open for editing — save or build it again.'
    },
    error: {
      icon: 'pi pi-exclamation-triangle',
      title: 'Build failed',
      subtitle: 'The last build failed. Fix the configuration and build again.'
    }
  }

  const FALLBACK = {
    icon: 'pi pi-info-circle',
    title: 'Version',
    subtitle: 'Create a new version to make changes.'
  }

  // Capability comes from the shell context; defaults to deployable outside it.
  const { capability } = useVersionContext()
  const cap = computed(() => capability?.value ?? DEFAULT_CAPABILITY)

  const banner = computed(() => BANNER[props.state] ?? FALLBACK)

  // Drop Deploy-related copy when the resource can't deploy (versioned-only).
  const subtitle = computed(() =>
    !cap.value.canDeploy && banner.value.subtitleVersionedOnly
      ? banner.value.subtitleVersionedOnly
      : banner.value.subtitle
  )

  // Buttons from the shared single source, intersected with the state-allowed +
  // registered handlers (availableActions) — identical to the heading's set.
  const actions = computed(() =>
    getVersionBarActions(props.state, cap.value).filter((action) =>
      props.availableActions.includes(action.key)
    )
  )

  const readOnly = computed(() => isImmutable(props.state))
  const editable = computed(() => isEditable(props.state))

  const isDisabled = (key) => props.disabledActions.includes(key)

  const handleClick = (key) => {
    if (isDisabled(key)) return
    emit('dispatch', key, {})
  }
</script>

<template>
  <div
    class="flex w-full flex-col gap-[var(--spacing-3)] border-t border-[var(--surface-border)] bg-[var(--surface-section)] px-[var(--spacing-2)] py-[var(--spacing-3)] sticky bottom-0 z-50 md:flex-row md:items-center md:justify-between md:px-[var(--spacing-8)]"
    data-testid="version-action-bar"
    :data-state="state"
  >
    <div class="flex items-start gap-[var(--spacing-3)]">
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--shape-elements)] bg-[var(--surface-ground)]"
      >
        <i :class="[banner.icon, 'text-[var(--text-color-secondary)]']" />
      </span>
      <div class="flex flex-col gap-[var(--spacing-1)]">
        <span class="flex flex-wrap items-center gap-[var(--spacing-2)]">
          <span class="text-body-sm font-medium text-[var(--text-color)]">{{ banner.title }}</span>
          <VersionStateBadge :state="state" />
          <span
            v-if="readOnly"
            class="inline-flex items-center gap-[var(--spacing-1)] rounded-[var(--shape-elements)] border border-[var(--surface-border)] px-[var(--spacing-2)] py-[2px] text-body-xs text-[var(--text-color-secondary)]"
            data-testid="version-action-bar__readonly"
          >
            <i class="pi pi-lock" />
            Read Only
          </span>
          <PrimeTag
            v-else-if="editable"
            severity="info"
            value="Editable"
            data-testid="version-action-bar__editable"
          />
        </span>
        <span class="text-body-xs text-[var(--text-color-secondary)]">
          {{ subtitle }}
        </span>
      </div>
    </div>

    <div class="flex shrink-0 items-center justify-end gap-[var(--spacing-3)]">
      <PrimeButton
        v-for="action in actions"
        :key="action.key"
        :label="action.label"
        :icon="action.icon"
        size="small"
        :outlined="action.emphasis === 'secondary'"
        :severity="action.emphasis === 'secondary' ? 'secondary' : undefined"
        :disabled="isDisabled(action.key)"
        :data-testid="`version-action-bar__action-${action.key}`"
        @click="handleClick(action.key)"
      />
    </div>
  </div>
</template>
