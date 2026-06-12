<script setup>
  import { computed, provide } from 'vue'
  import ProgressSpinner from '@aziontech/webkit/progressspinner'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import { useVersionShell } from './use-version-shell'
  import { VERSION_CONTEXT_KEY } from '@/composables/versioning/use-version-context'
  import { VERSION_ACTIONS, isProcessing } from '@/composables/versioning/version-machine'
  import {
    createVersionCommandBus,
    VERSION_COMMAND_BUS_KEY
  } from '@/composables/versioning/use-version-command-bus'
  import VersionActionBar from './components/VersionActionBar.vue'
  import ProcessingOverlay from './components/ProcessingOverlay.vue'

  defineOptions({ name: 'version-shell-block' })

  /**
   * Props:
   *  - useVersionQuery: () => UseQueryReturn — factory returning the version's useQuery.
   *                    Typically `() => service.useLoadVersionQuery(rid, vid)`.
   *                    The service controls queryKey, queryFn and refetchInterval.
   *  - resourceId, versionId — used to build the command ctx.
   */
  const props = defineProps({
    useVersionQuery: {
      type: Function,
      required: true
    },
    resourceId: {
      type: [String, Number],
      required: true
    },
    versionId: {
      type: String,
      required: true
    }
  })

  const emit = defineEmits(['updated', 'command-error', 'cancel'])

  // Creates this instance's unique bus and provides it to descendants.
  const bus = createVersionCommandBus()
  provide(VERSION_COMMAND_BUS_KEY, bus)

  const {
    version,
    state,
    readOnly,
    availableActions,
    disabledActions,
    dispatch,
    isLoading,
    isError
  } = useVersionShell({
    useVersionQuery: props.useVersionQuery,
    resourceId: props.resourceId,
    versionId: props.versionId,
    bus
  })

  provide(VERSION_CONTEXT_KEY, { state, readOnly, version })

  // A command error never propagates as a rejection — the caller decides the UI (toast) via `command-error`.
  // Success delivers `{ action, result }` (e.g. draft created by NEW_DRAFT_FROM for navigation).
  const handleDispatch = async (action, payload) => {
    try {
      const result = await dispatch(action, payload)
      emit('updated', { action, result })
    } catch (error) {
      emit('command-error', { action, error })
    }
  }

  const overlayCanCancel = computed(() =>
    availableActions.value.includes(VERSION_ACTIONS.CANCEL_BUILD)
  )

  const handleOverlayCancel = () => handleDispatch(VERSION_ACTIONS.CANCEL_BUILD, {})

  const showOverlay = computed(() => isProcessing(state.value))
</script>

<template>
  <div
    class="version-shell relative"
    data-testid="version-shell"
  >
    <div
      v-if="isLoading"
      class="flex items-center justify-center p-8"
      data-testid="version-shell__loading"
    >
      <ProgressSpinner
        class="w-10 h-10 text-color"
        strokeWidth="4"
      />
    </div>

    <InlineMessage
      v-else-if="isError"
      class="w-full"
      severity="error"
      data-testid="version-shell__error"
    >
      Failed to load version. Try refreshing the page.
    </InlineMessage>

    <template v-else>
      <div
        class="relative"
        data-testid="version-shell__body"
      >
        <ProcessingOverlay
          v-if="showOverlay"
          :state="state"
          :can-cancel="overlayCanCancel"
          @cancel="handleOverlayCancel"
        />

        <slot />
      </div>

      <div
        class="mt-4"
        data-testid="version-shell__footer"
      >
        <VersionActionBar
          :state="state"
          :available-actions="availableActions"
          :disabled-actions="disabledActions"
          @dispatch="handleDispatch"
          @cancel="emit('cancel')"
        />
      </div>
    </template>
  </div>
</template>
