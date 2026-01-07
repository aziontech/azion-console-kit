<script setup>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { useToast } from 'primevue/usetoast'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { computed, ref, nextTick, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAttrs } from 'vue'
  import { useScrollToError } from '@/composables/useScrollToError'
  import { capitalizeFirstLetter } from '@/helpers'

  defineOptions({ name: 'create-form-block' })

  const props = defineProps({
    createService: {
      type: Function,
      required: true
    },
    schema: {
      type: Object,
      required: true
    },
    initialValues: {
      type: Object,
      default: () => ({})
    },
    disabledCallback: {
      type: Boolean,
      default: false
    },
    disableAfterCreateToastFeedback: {
      type: Boolean,
      default: false
    },
    cleanForm: {
      type: Boolean,
      default: true
    },
    unSaved: {
      type: Boolean,
      default: true
    },
    disableToast: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['on-response', 'on-response-fail', 'onError'])
  const attrs = useAttrs()
  const { scrollToError } = useScrollToError()

  const router = useRouter()
  const toast = useToast()
  const blockViewRedirection = ref(props.unSaved)
  const isInitializing = ref(true)
  const isDirty = useIsFormDirty()

  const formHasChanges = computed(() => {
    return blockViewRedirection.value && isDirty.value && !isInitializing.value
  })

  onMounted(async () => {
    await nextTick()
    setTimeout(() => {
      isInitializing.value = false
    }, 100)
  })

  const classForm = computed(() => {
    return attrs.class || 'flex flex-col min-h-[calc(100vh-300px)]'
  })

  const { meta, errors, handleSubmit, isSubmitting, values, resetForm } = useForm({
    validationSchema: props.schema,
    initialValues: props.initialValues
  })

  const onCancel = () => {
    router.go(-1)
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

  const showToastWithActions = (toastData) => {
    const options = {
      closable: true,
      severity: 'success',
      summary: 'Success',
      detail: toastData.feedback,
      additionalDetails: toastData?.additionalFeedback,
      action: toastData?.actions
    }

    toast.add(options)
  }

  const showFeedback = (feedback = 'created successfully') => {
    const feedbackMessage = feedback
    if (props.disableAfterCreateToastFeedback) {
      return
    }
    showToast('success', feedbackMessage)
  }

  const redirectToUrl = (path, params = {}) => {
    router.push({ path, params, query: params })
  }

  const handleSuccess = (response) => {
    emit('on-response', { ...response, showToastWithActions, redirectToUrl })
    if (props.disableToast) {
      router.go(-1)
      return
    }
    showFeedback(response?.feedback)
    if (props.disabledCallback) return
    redirectToUrl(response?.urlToEditView, response?.params)
  }

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        blockViewRedirection.value = false
        const response = await props.createService(values)
        handleSuccess(response)
      } catch (error) {
        if (error && typeof error.showErrors === 'function') {
          error.showErrors(toast)
          emit('on-response-fail', error.message[0] || error)
        } else {
          // Fallback for legacy errors or non-ErrorHandler errors
          const errorMessage = error?.message || error
          emit('onError', errorMessage)
          showToast('error', errorMessage)
        }
      }
    },
    ({ errors }) => {
      scrollToError(errors)
    }
  )

  defineExpose({
    resetForm,
    values,
    showToastWithActions,
    showFeedback,
    redirectToUrl
  })
</script>

<template>
  <div :class="classForm">
    <form class="w-full grow flex flex-col gap-8 max-md:gap-6">
      <slot
        name="form"
        :resetForm="resetForm"
        :errors="errors"
      />
      <slot
        name="raw-form"
        :errors="errors"
      />
    </form>
    <DialogUnsavedBlock :blockRedirectUnsaved="formHasChanges" />
    <slot
      name="action-bar"
      :onSubmit="onSubmit"
      :formValid="meta.valid"
      :onCancel="onCancel"
      :errors="errors"
      :loading="isSubmitting"
      :values="values"
    />
  </div>
</template>
