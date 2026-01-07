<script setup>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { useToast } from 'primevue/usetoast'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { computed, ref, watch, inject, nextTick } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useScrollToError } from '@/composables/useScrollToError'
  import { capitalizeFirstLetter } from '@/helpers'

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

  const { scrollToError } = useScrollToError()
  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const blockViewRedirection = ref(true)
  const isInitializing = ref(true)

  const { meta, errors, handleSubmit, isSubmitting, resetForm, values, setValues } = useForm({
    validationSchema: props.schema,
    initialValues: props.initialValues
  })

  let formHasUpdated, visibleOnSaved

  if (props.isTabs) {
    const unsavedStatus = inject('unsaved')
    formHasUpdated = unsavedStatus.formHasUpdated
    visibleOnSaved = unsavedStatus.visibleOnSaved
  }

  const isDirty = useIsFormDirty()

  const formHasChanges = computed(() => {
    return blockViewRedirection.value && isDirty.value && !isInitializing.value
  })

  watch(formHasChanges, () => {
    if (!props.isTabs) return
    formHasUpdated.value = formHasChanges.value
    visibleOnSaved.value = false
  })

  const goBackToList = () => {
    if (props.updatedRedirect) {
      router.push({ name: props.updatedRedirect })
      return
    }
    router.go(-1)
  }

  const onCancel = () => {
    goBackToList()
  }

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

  const normalizeInitialValues = (values) => {
    try {
      return props.schema.cast(values, { stripUnknown: false, assert: false })
    } catch (error) {
      return values
    }
  }

  const loadInitialData = async () => {
    try {
      if (props.initialValues && Object.keys(props.initialValues).length > 0) {
        const initialValues = normalizeInitialValues(props.initialValues)
        emit('loaded-service-object', initialValues)
        resetForm({ values: initialValues })
        await nextTick()
        setTimeout(() => {
          isInitializing.value = false
        }, 100)
        return
      }
      const { id } = route.params
      const loadedValues = await props.loadService({ id })
      const initialValues = normalizeInitialValues(loadedValues)
      emit('loaded-service-object', initialValues)
      resetForm({ values: initialValues })
      await nextTick()
      setTimeout(() => {
        isInitializing.value = false
      }, 100)
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        emit('on-load-fail', error)
        showToast('error', error)
      }
      goBackToList()
    }
  }

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        const feedback = await props.editService(values)
        if (!props.disableAfterCreateToastFeedback) {
          showToast('success', feedback || 'edited successfully')
        }
        blockViewRedirection.value = false
        emit('on-edit-success', feedback)
        if (props.disableRedirect) {
          isInitializing.value = true
          resetForm({ values })
          await nextTick()
          setTimeout(() => {
            isInitializing.value = false
          }, 100)
          blockViewRedirection.value = true
          return
        }
        goBackToList()
      } catch (error) {
        blockViewRedirection.value = true
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
  <div class="flex flex-col min-h-[calc(100vh-300px)]">
    <form
      @submit.prevent="handleSubmit"
      class="w-full grow flex flex-col gap-8 max-md:gap-6"
      :class="{ 'mt-4': isTabs }"
    >
      <slot
        name="form"
        :errors="errors"
      />

      <slot
        name="raw-form"
        :errors="errors"
      />
    </form>
  </div>

  <DialogUnsavedBlock
    :blockRedirectUnsaved="formHasChanges"
    :isTabs="isTabs"
  />
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
