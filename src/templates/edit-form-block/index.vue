
<script setup>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { computed, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'

  defineOptions({ name: 'edit-form-block' })

  const props = defineProps({
    editService: {
      type: Function,
      required: true
    },
    loadService: {
      type: Function,
      required: true
    },
    backURL: {
      type: String,
      required: false
    },
    updatedRedirect: {
      type: String,
      required: true
    },
    schema: {
      type: Object,
      required: true
    }
  })

  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const blockViewRedirection = ref(true)

  const { meta, errors, handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: props.schema
  })

  const formHasChanges = computed(() => {
    const isDirty = useIsFormDirty()
    return blockViewRedirection.value && isDirty.value
  })

  const goBackToList = () => {
    if (props.updatedRedirect) {
      router.push({ name: props.updatedRedirect })
      return
    }
    router.go(-1)
  }

  const onCancel = () => {
    if (props.backURL) {
      router.push({ path: props.backURL })
    } else {
      goBackToList()
    }
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

  const loadInitialData = async () => {
    try {
      const { id } = route.params
      const initialValues = await props.loadService({ id })
      resetForm({ values: initialValues })
    } catch (error) {
      showToast('error', error)
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const feedback = await props.editService(values)
      showToast('success', feedback ?? 'edited successfully')
      blockViewRedirection.value = false
      goBackToList()
    } catch (error) {
      blockViewRedirection.value = true
      showToast('error', error)
    }
  })

  loadInitialData()
</script>

<template>
  <div class="flex flex-col min-h-[calc(100vh-300px)]">
    <form
      @submit.prevent="handleSubmit"
      class="w-full grow flex flex-col gap-8 max-md:gap-6"
    >
      <slot name="form" />

      <slot name="raw-form" />
    </form>
  </div>

  <DialogUnsavedBlock :blockRedirectUnsaved="formHasChanges" />
  <slot
    name="action-bar"
    :onSubmit="onSubmit"
    :formValid="meta.valid"
    :onCancel="onCancel"
    :errors="errors"
    :loading="isSubmitting"
  />
</template>
