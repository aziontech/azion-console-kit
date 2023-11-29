<script setup>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { computed, ref } from 'vue'
  import { useRouter} from 'vue-router'
  import { useToast } from 'primevue/usetoast'

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
    disabledFeedback: {
      type: Boolean,
      default: false
    },
    disabledRedirect: {
      type: Boolean,
      default: false
    },
    cleanForm: {
      type: Boolean,
      default: true
    },
    goBack: {
      type: Boolean,
      required: true
    },
  })

  const emit = defineEmits(['on-response'])

  const router = useRouter()
  const toast = useToast()
  const blockViewRedirection = ref(true)

  const formHasChanges = computed(() => {
    const isDirty = useIsFormDirty()
    return blockViewRedirection.value && isDirty.value
  })



  const { meta, errors, handleSubmit, isSubmitting } = useForm({
    validationSchema: props.schema,
    initialValues: props.initialValues
  })

  const onCancel = () => {
    router.go(-1)
  }

  const showToast = (severity, summary, life = 10000) => {
    if (!summary) return
    toast.add({
      closable: false,
      severity: severity,
      summary: summary,
      life: life
    })
  }

  const showFeedback = (feedback = 'created successfully') => {
    if (props.disabledFeedback) return
    showToast('success', feedback)
  }

  const redirectToUrl = (path) => {
    router.push({ path })
  }

  const handleSuccess = (response) => {
    emit('on-response', response)
    showFeedback(response.feedback)
    if (props.disabledFeedback) return
    redirectToUrl(response.urlToEditView)
  }

  const onSubmit = handleSubmit(async (values, actions) => {
    try {
      const response = await props.createService(values)
      handleSuccess(response)
      if (props.goBack) onCancel()
      if (props.cleanForm) actions.resetForm()
      blockViewRedirection.value = false
    } catch (error) {
      showToast('error', error)
      blockViewRedirection.value = true
    }
  })
</script>

<template>
  <div class="flex flex-col min-h-[calc(100vh-300px)]">
    <form class="w-full grow flex flex-col gap-8 max-md:gap-6">
      <slot name="form" />
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
    />
  </div>
</template>
