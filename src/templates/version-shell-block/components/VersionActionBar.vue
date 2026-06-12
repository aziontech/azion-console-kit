<script setup>
  import { computed, ref } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import VersionActionDialog from './VersionActionDialog.vue'

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

  // `dispatch` carries version lifecycle commands (SAVE, BUILD, ...).
  // `cancel` is a pure navigation intent — close the edit and go back to the
  // listing — so it deliberately bypasses the command bus / state machine.
  const emit = defineEmits(['dispatch', 'cancel'])

  const PRIMARY_BY_STATE = {
    draft: { action: 'SAVE_AND_BUILD', label: 'Save and Build', severity: 'primary' },
    building: { action: 'CANCEL_BUILD', label: 'Cancel Build', severity: 'danger' },
    ready: { action: 'NEW_DRAFT_FROM', label: 'Clone as Draft', severity: 'primary' },
    active: { action: 'NEW_DRAFT_FROM', label: 'Clone as Draft', severity: 'primary' },
    archived: { action: 'NEW_DRAFT_FROM', label: 'Clone as Draft', severity: 'primary' },
    cancelled: { action: 'SAVE_AND_BUILD', label: 'Save and Build', severity: 'primary' },
    failed: { action: 'SAVE_AND_BUILD', label: 'Save and Build', severity: 'primary' }
  }

  const ACTION_LABELS = {
    SAVE: 'Save Draft',
    SAVE_AND_BUILD: 'Save and Build',
    CANCEL_BUILD: 'Cancel Build',
    NEW_DRAFT_FROM: 'Clone as Draft',
    ARCHIVE: 'Archive',
    DELETE: 'Delete'
  }

  const REQUIRES_COMMENT = {
    ARCHIVE: {
      required: true,
      title: 'Archive Version',
      actionLabel: 'Archive',
      placeholder: 'Reason for archiving (required)'
    },
    CANCEL_BUILD: {
      required: false,
      title: 'Cancel Build',
      actionLabel: 'Cancel Build',
      placeholder: 'Optional comment'
    },
    NEW_DRAFT_FROM: {
      required: false,
      title: 'Clone as Draft',
      actionLabel: 'Create Draft',
      placeholder: 'Optional comment'
    }
  }

  const DANGER_ACTIONS = new Set(['DELETE'])

  const isDisabled = (action) => props.disabledActions.includes(action)

  const primaryAction = computed(() => {
    const candidate = PRIMARY_BY_STATE[props.state]
    if (!candidate) return null
    if (!props.availableActions.includes(candidate.action)) return null
    return candidate
  })

  const secondaryActions = computed(() => {
    const primary = primaryAction.value?.action
    return props.availableActions.filter((action) => action !== primary)
  })

  const severityFor = (action) => (DANGER_ACTIONS.has(action) ? 'danger' : 'secondary')

  const dialogVisible = ref(false)
  const pendingAction = ref(null)
  const dialogConfig = computed(() =>
    pendingAction.value ? REQUIRES_COMMENT[pendingAction.value] : null
  )

  const handleClick = (action) => {
    if (isDisabled(action)) return
    if (REQUIRES_COMMENT[action]) {
      pendingAction.value = action
      dialogVisible.value = true
      return
    }
    emit('dispatch', action, {})
  }

  const handleDialogConfirm = (comment) => {
    const action = pendingAction.value
    if (!action) return
    emit('dispatch', action, { comment })
    pendingAction.value = null
    dialogVisible.value = false
  }

  const handleDialogVisibility = (value) => {
    dialogVisible.value = value
    if (!value) pendingAction.value = null
  }
</script>

<template>
  <div
    class="flex w-full gap-3 justify-end items-center"
    data-testid="version-action-bar"
  >
    <PrimeButton
      label="Cancel"
      size="small"
      outlined
      data-testid="version-action-bar__cancel"
      @click="emit('cancel')"
    />
    <PrimeButton
      v-for="action in secondaryActions"
      :key="action"
      :label="ACTION_LABELS[action]"
      :severity="severityFor(action)"
      size="small"
      outlined
      :disabled="isDisabled(action)"
      :data-testid="`version-action-bar__secondary-${action}`"
      @click="handleClick(action)"
    />
    <PrimeButton
      v-if="primaryAction"
      :label="primaryAction.label"
      :severity="primaryAction.severity"
      size="small"
      :disabled="isDisabled(primaryAction.action)"
      :data-testid="`version-action-bar__primary-${primaryAction.action}`"
      @click="handleClick(primaryAction.action)"
    />
    <VersionActionDialog
      v-if="dialogConfig"
      :visible="dialogVisible"
      :title="dialogConfig.title"
      :action-label="dialogConfig.actionLabel"
      :require-comment="dialogConfig.required"
      :placeholder="dialogConfig.placeholder"
      @confirm="handleDialogConfirm"
      @update:visible="handleDialogVisibility"
    />
  </div>
</template>
