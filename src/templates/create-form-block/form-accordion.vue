<script setup>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'

  import { useToast } from 'primevue/usetoast'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { computed, ref, nextTick, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import { useScrollToError } from '@/composables/useScrollToError'
  import { capitalizeFirstLetter } from '@/helpers'

  defineOptions({ name: 'form-accordion' })

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
    }
  })

  const emit = defineEmits(['on-response', 'on-response-fail'])
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

  const { meta, errors, handleSubmit, isSubmitting, values, resetForm } = useForm({
    validationSchema: props.schema,
    initialValues: props.initialValues
  })

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

  const showFeedback = (feedback = 'created successfully') => {
    const feedbackMessage = feedback
    if (props.disableAfterCreateToastFeedback) {
      return
    }
    showToast('success', feedbackMessage)
  }

  const redirectToUrl = (path) => {
    router.push({ path })
  }

  const handleSuccess = (response) => {
    emit('on-response', response)
    showFeedback(response?.feedback)
    if (props.disabledCallback) return
    redirectToUrl(response?.urlToEditView)
  }

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        blockViewRedirection.value = false
        const response = await props.createService(values)
        handleSuccess(response)
      } catch (error) {
        blockViewRedirection.value = true
        // Check if error is an ErrorHandler instance (from v2 services)
        if (error && typeof error.showErrors === 'function') {
          error.showErrors(toast)
          emit('onError', error.message[0])
        } else {
          // Fallback for legacy errors or non-ErrorHandler errors
          showToast('error', error)
          emit('on-response-fail', error)
        }
      }
    },
    ({ errors }) => {
      scrollToError(errors)
    }
  )

  defineExpose({
    resetForm,
    values
  })
</script>

<template>
  <div>
    <form>
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
      name="action-bar-accordion"
      :onSubmit="onSubmit"
      :formValid="meta.valid"
      :errors="errors"
      :loading="isSubmitting"
      :values="values"
    />
  </div>
</template>
