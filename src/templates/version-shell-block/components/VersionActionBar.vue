<script setup>
  import { computed } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeTag from '@aziontech/webkit/prime-tag'
  import VersionStateBadge from './VersionStateBadge.vue'
  import { isImmutable, isEditable } from '@/composables/versioning/version-machine'

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

  // Per-state banner copy + curated actions (the proposed toolbar format). Actions
  // dispatch directly (no dialog); they are still filtered by availableActions.
  const BANNER = {
    draft: {
      icon: 'pi pi-file-edit',
      title: 'Draft',
      subtitle: 'This version is open for editing. Deploy it when ready.',
      actions: [
        {
          key: 'SAVE_AND_BUILD',
          label: 'Save and Build',
          icon: 'pi pi-cog',
          emphasis: 'secondary'
        },
        { key: 'SAVE', label: 'Save', icon: 'pi pi-save', emphasis: 'primary' }
      ]
    },
    building: {
      icon: 'pi pi-spin pi-spinner',
      title: 'Building version',
      subtitle: 'This version is being built. You can cancel while it runs.',
      actions: [
        { key: 'CANCEL_BUILD', label: 'Cancel Build', icon: 'pi pi-times', emphasis: 'secondary' }
      ]
    },
    ready: {
      icon: 'pi pi-check-circle',
      title: 'Viewing a Ready version',
      subtitle:
        'This version is read-only. Create a new version to make changes, or deploy it to go live.',
      actions: [
        { key: 'NEW_DRAFT_FROM', label: 'New Version', icon: 'pi pi-plus', emphasis: 'secondary' },
        { key: 'DEPLOY', label: 'Deploy', icon: 'pi pi-cloud-upload', emphasis: 'primary' }
      ]
    },
    active: {
      icon: 'pi pi-check-circle',
      title: 'Viewing a Deployed version',
      subtitle:
        'This version has been deployed and is read-only. Create a new version to make changes.',
      actions: [
        { key: 'NEW_DRAFT_FROM', label: 'New Version', icon: 'pi pi-plus', emphasis: 'secondary' },
        { key: 'DEPLOY', label: 'Redeploy', icon: 'pi pi-refresh', emphasis: 'secondary' }
      ]
    },
    archived: {
      icon: 'pi pi-inbox',
      title: 'Viewing an Archived version',
      subtitle: 'This version is archived and read-only. Create a new version to make changes.',
      actions: [
        { key: 'NEW_DRAFT_FROM', label: 'New Version', icon: 'pi pi-plus', emphasis: 'secondary' }
      ]
    }
  }

  const FALLBACK = {
    icon: 'pi pi-info-circle',
    title: 'Version',
    subtitle: 'Create a new version to make changes.',
    actions: [
      { key: 'NEW_DRAFT_FROM', label: 'New Version', icon: 'pi pi-plus', emphasis: 'secondary' }
    ]
  }

  const banner = computed(() => BANNER[props.state] ?? FALLBACK)

  // Only render configured actions that the state machine actually allows.
  const actions = computed(() =>
    banner.value.actions.filter((action) => props.availableActions.includes(action.key))
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
    class="flex w-full flex-col gap-3 border-t border-[var(--surface-border)] bg-[var(--surface-section)] px-2 py-3 sticky bottom-0 z-50 md:flex-row md:items-center md:justify-between md:px-8"
    data-testid="version-action-bar"
    :data-state="state"
  >
    <div class="flex items-start gap-3">
      <span
        class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--surface-ground)]"
      >
        <i :class="[banner.icon, 'text-[var(--text-color-secondary)]']" />
      </span>
      <div class="flex flex-col gap-1">
        <span class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium text-[var(--text-color)]">{{ banner.title }}</span>
          <VersionStateBadge :state="state" />
          <span
            v-if="readOnly"
            class="inline-flex items-center gap-1 rounded-md border border-[var(--surface-border)] px-2 py-0.5 text-xs text-[var(--text-color-secondary)]"
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
        <span class="text-xs text-[var(--text-color-secondary)] leading-tight">
          {{ banner.subtitle }}
        </span>
      </div>
    </div>

    <div class="flex shrink-0 items-center justify-end gap-3">
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
