<script setup>
  import DialogUnsaved from '@/templates/dialog-unsaved/DialogUnsaved.vue'
  import { useToast } from '@aziontech/webkit/use-toast'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { ref, computed, nextTick, onBeforeUnmount, provide } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useScrollToError } from '@/composables/useScrollToError'
  import { capitalizeFirstLetter } from '@/helpers'
  import { useUnsavedChanges } from '@/composables/useUnsavedChanges'
  import { useTabUnsaved } from '@/composables/useTabUnsaved'

  defineOptions({ name: 'edit-form-block' })

  const props = defineProps({
    isTabs: {
      type: Boolean,
      default: false
    },
    editService: {
      type: Function,
      required: true
    },
    loadService: {
      type: Function,
      required: true
    },
    disableRedirect: {
      type: Boolean,
      default: false
    },
    updatedRedirect: {
      type: String
    },
    schema: {
      type: Object,
      required: true
    },
    disableAfterCreateToastFeedback: {
      type: Boolean,
      default: false
    },
    initialValues: {
      type: Object,
      default: () => ({})
    }
  })

  const emit = defineEmits([
    'on-edit-success',
    'on-edit-fail',
    'on-load-fail',
    'loaded-service-object',
    'onError'
  ])

  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const { scrollToError } = useScrollToError()

  const { meta, errors, handleSubmit, isSubmitting, resetForm, values, setValues } = useForm({
    validationSchema: props.schema
  })

  const isLoadingData = ref(true)
  const isFormReady = ref(false)

  const isDirty = useIsFormDirty()

  // When inside tabs, register dirty source with the parent TabsView context.
  // The route guard is owned by the TabsView's composable instance.
  const tabContext = props.isTabs ? useTabUnsaved() : undefined

  const unsaved = tabContext
    ? tabContext.unsaved
    : useUnsavedChanges({
        isReady: isFormReady,
        enableRouteGuard: true,
        enableBeforeUnload: true
      })

  const asyncChildPromises = []
  const registerAsyncFormChild = () => {
    let resolve
    const promise = new Promise((promiseResolve) => {
      resolve = promiseResolve
    })
    asyncChildPromises.push(promise)
    return resolve
  }
  provide('registerAsyncFormChild', registerAsyncFormChild)

  const effectiveDirty = computed(() => isFormReady.value && isDirty.value)
  const unregisterDirtySource = unsaved.addDirtySource(effectiveDirty)

  onBeforeUnmount(() => {
    unregisterDirtySource()
  })

  const goBackToList = () => {
    if (props.updatedRedirect) {
      router.push({ name: props.updatedRedirect })
      return
    }

    router.go(-1)
  }

  const onCancel = () => goBackToList()

  const showToast = (severity, detail) => {
    if (!detail) return

    const options = {
      closable: true,
      severity,
      summary: capitalizeFirstLetter(severity),
      detail
    }

    toast.add(options)
  }

  const loadInitialData = async () => {
    try {
      const hasCachedValues = props.initialValues && Object.keys(props.initialValues).length > 0

      if (hasCachedValues) {
        resetForm({ values: props.initialValues })
        emit('loaded-service-object', props.initialValues)
      }

      const { id } = route.params

      const loadedValues = await props.loadService({ id })

      if (!loadedValues || Object.keys(loadedValues).length === 0) {
        return
      }

      // Filter out undefined values from initialValues to prevent overwriting loaded data
      const definedInitialValues = props.initialValues
        ? Object.fromEntries(
            Object.entries(props.initialValues).filter(([, value]) => value !== undefined)
          )
        : {}

      const mergedValues = hasCachedValues
        ? { ...loadedValues, ...definedInitialValues }
        : loadedValues

      emit('loaded-service-object', mergedValues)

      resetForm({ values: mergedValues })

      // Wait for child FormField onMounted hooks to fire,
      // then re-reset to capture any values they set as the clean baseline.
      await nextTick()
      resetForm({ values: { ...values } })
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        emit('on-load-fail', error)
        showToast('error', error)

        unsaved.disable()
      }

      goBackToList()
    } finally {
      isLoadingData.value = false
      await Promise.all(asyncChildPromises)
      await nextTick()
      resetForm({ values: { ...values } })
      isFormReady.value = true
    }
  }

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        const feedback = await props.editService(values)

        if (!props.disableAfterCreateToastFeedback) {
          showToast('success', feedback || 'edited successfully')
        }

        unsaved.disable()

        emit('on-edit-success', feedback)

        if (props.disableRedirect) {
          resetForm({ values })
          unsaved.enable()
          return
        }

        goBackToList()
      } catch (error) {
        // Check if error is an ErrorHandler instance (from v2 services)
        if (error && typeof error.showErrors === 'function') {
          error.showErrors(toast)
          emit('onError', error.message[0])
        } else {
          // Fallback for legacy errors or non-ErrorHandler errors
          const errorMessage = error?.message || error
          emit('onError', errorMessage)
          emit('on-edit-fail', error)
          showToast('error', errorMessage)
        }
      }
    },
    ({ errors }) => {
      scrollToError(errors)
    }
  )

  loadInitialData()
</script>

<template>
  <DialogUnsaved
    :visible="unsaved.isDialogVisible.value"
    @leave="unsaved.confirmLeave"
    @stay="unsaved.cancelLeave"
  />

  <div class="flex flex-col min-h-[calc(100vh-300px)]">
    <form
      @submit.prevent="handleSubmit"
      class="w-full grow flex flex-col gap-8 max-md:gap-6"
      :class="{ 'mt-4': isTabs }"
    >
      <slot
        name="form"
        :errors="errors"
        :loading="isLoadingData"
      />

      <slot
        name="raw-form"
        :errors="errors"
      />
    </form>
  </div>
  <slot
    name="action-bar"
    :onSubmit="onSubmit"
    :handleSubmit="handleSubmit"
    :formValid="meta.valid"
    :onCancel="onCancel"
    :errors="errors"
    :loading="isSubmitting"
    :values="values"
    :setValues="setValues"
  />
</template>
