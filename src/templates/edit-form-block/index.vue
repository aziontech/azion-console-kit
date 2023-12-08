<script setup>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { computed, ref } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useToast } from 'primevue/usetoast'

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
    backURL: {
      type: String,
      required: false
    },
    disableRedirect: {
      type: Boolean,
      default: false
    },
    updatedRedirect: {
      type: String,
    },
    schema: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['on-edit-success'])

  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const blockViewRedirection = ref(true)

  const { meta, errors, handleSubmit, isSubmitting, resetForm, values } = useForm({
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

  const showToast = (severity, summary) => {
    if (!summary) return
    toast.add({
      closable: true,
      severity: severity,
      summary: summary
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
      emit('on-edit-success', feedback)
      if (props.disableRedirect) {
        return
      }
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
      :class="{ 'mt-4': isTabs }"
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
    :values="values"
  />
</template>
