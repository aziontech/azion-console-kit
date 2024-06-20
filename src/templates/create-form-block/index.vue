<script setup>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { useToast } from 'primevue/usetoast'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { computed, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { TOAST_LIFE } from '@/utils/constants'
  import { useAttrs } from 'vue'

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
    }
  })

  const emit = defineEmits(['on-response', 'on-response-fail'])
  const attrs = useAttrs()

  const router = useRouter()
  const toast = useToast()
  const blockViewRedirection = ref(props.unSaved)

  const formHasChanges = computed(() => {
    const isDirty = useIsFormDirty()
    return blockViewRedirection.value && isDirty.value
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
      summary: severity,
      detail
    }

    if (severity === 'success') {
      options.life = TOAST_LIFE
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
    redirectToUrl(response.urlToEditView)
  }

  const onSubmit = handleSubmit(
    async (values) => {
      try {
        blockViewRedirection.value = false
        const response = await props.createService(values)
        handleSuccess(response)
      } catch (error) {
        showToast('error', error)
        emit('on-response-fail', error)
        blockViewRedirection.value = true
      }
    },
    ({ errors }) => {
      const drawerOpen = document.querySelector('.p-sidebar-content[data-pc-section="content"]')

      const view = drawerOpen ?? window
      const errorKeys = Object.keys(errors)
      const stringQuerySelector = errorKeys
        .map((key) => {
          return key.startsWith('monaco') ? `[name="${key}"] textarea` : `[name="${key}"]`
        })
        .join(', ')

      const listEl = document.querySelectorAll(stringQuerySelector)
      if (!listEl.length) return

      const firstElError = listEl[0]
      const MARGIN_TOP = 150
      const elementPosition = firstElError.getBoundingClientRect().top + view.scrollY - MARGIN_TOP
      view.scrollTo({ top: elementPosition, behavior: 'smooth' })
      firstElError.focus({ preventScroll: true })
      firstElError.click()
    }
  )
</script>

<template>
  <div :class="classForm">
    <form class="w-full grow flex flex-col gap-8 max-md:gap-6">
      <slot
        name="form"
        :resetForm="resetForm"
      />
      <slot name="raw-form" />
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
