<script setup>
  import { computed, ref } from 'vue'
  import PrimeButton from '@aziontech/webkit/button'
  import VersionActionDialog from './VersionActionDialog.vue'
  import { metaFor } from '@/composables/versioning/version-actions'

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

  const PRIMARY_ACTIONS_BY_STATE = {
    draft: ['SAVE_AND_BUILD'],
    building: ['CANCEL_BUILD'],
    ready: ['DEPLOY'],
    active: ['NEW_DRAFT_FROM'],
    archived: ['NEW_DRAFT_FROM'],
    cancelled: ['SAVE_AND_BUILD'],
    error: ['SAVE_AND_BUILD']
  }

  const isDisabled = (action) => props.disabledActions.includes(action)

  const primarySet = computed(
    () =>
      new Set(
        (PRIMARY_ACTIONS_BY_STATE[props.state] ?? []).filter((action) =>
          props.availableActions.includes(action)
        )
      )
  )

  const primaryActions = computed(() =>
    props.availableActions.filter((action) => primarySet.value.has(action))
  )

  const deleteAction = computed(() => (props.availableActions.includes('DELETE') ? 'DELETE' : null))

  const secondaryActions = computed(() =>
    props.availableActions.filter((action) => action !== 'DELETE' && !primarySet.value.has(action))
  )

  const severityFor = (action, emphasis) => {
    if (metaFor(action).danger) return 'danger'
    return emphasis === 'primary' ? 'primary' : 'secondary'
  }

  const dialogVisible = ref(false)
  const pendingAction = ref(null)
  const dialogConfig = computed(() =>
    pendingAction.value ? metaFor(pendingAction.value).dialog : null
  )

  const handleClick = (action) => {
    if (isDisabled(action)) return
    if (metaFor(action).dialog) {
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
    class="flex w-full gap-3 justify-end h-16 items-center border-t surface-border sticky bottom-0 surface-section z-50 px-2 md:px-8"
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
      v-if="deleteAction"
      :label="metaFor(deleteAction).label"
      :severity="severityFor(deleteAction, 'secondary')"
      size="small"
      :outlined="!metaFor(deleteAction).danger"
      :disabled="isDisabled(deleteAction)"
      :data-testid="`version-action-bar__secondary-${deleteAction}`"
      @click="handleClick(deleteAction)"
    />
    <PrimeButton
      v-for="action in secondaryActions"
      :key="action"
      :label="metaFor(action).label"
      :severity="severityFor(action, 'secondary')"
      size="small"
      :outlined="!metaFor(action).danger"
      :disabled="isDisabled(action)"
      :data-testid="`version-action-bar__secondary-${action}`"
      @click="handleClick(action)"
    />
    <PrimeButton
      v-for="action in primaryActions"
      :key="action"
      :label="metaFor(action).label"
      :severity="severityFor(action, 'primary')"
      size="small"
      :disabled="isDisabled(action)"
      :data-testid="`version-action-bar__primary-${action}`"
      @click="handleClick(action)"
    />
    <VersionActionDialog
      v-if="dialogConfig"
      :visible="dialogVisible"
      :title="dialogConfig.title"
      :action-label="dialogConfig.actionLabel"
      :require-comment="dialogConfig.required ?? false"
      :placeholder="dialogConfig.placeholder"
      :message="dialogConfig.message"
      :show-comment="dialogConfig.showComment ?? true"
      :confirm-severity="dialogConfig.confirmSeverity"
      @confirm="handleDialogConfirm"
      @update:visible="handleDialogVisibility"
    />
  </div>
</template>
