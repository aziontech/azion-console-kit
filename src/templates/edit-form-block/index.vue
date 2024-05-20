<script setup>
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { useToast } from 'primevue/usetoast'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { computed, ref, watch, inject } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { TOAST_LIFE } from '@/utils/constants'

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
    }
  })

  const emit = defineEmits(['on-edit-success', 'on-edit-fail'])

  const router = useRouter()
  const route = useRoute()
  const toast = useToast()
  const blockViewRedirection = ref(true)

  const { meta, errors, handleSubmit, isSubmitting, resetForm, values, setValues } = useForm({
    validationSchema: props.schema
  })

  let formHasUpdated, visibleOnSaved

  if (props.isTabs) {
    const unsavedStatus = inject('unsaved')
    formHasUpdated = unsavedStatus.formHasUpdated
    visibleOnSaved = unsavedStatus.visibleOnSaved
  }

  const isDirty = useIsFormDirty()

  const formHasChanges = computed(() => {
    return blockViewRedirection.value && isDirty.value
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
      summary: severity,
      detail
    }

    if (severity === 'success') {
      options.life = TOAST_LIFE
    }

    toast.add(options)
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
        resetForm({ values })
        blockViewRedirection.value = true
        return
      }
      goBackToList()
    } catch (error) {
      emit('on-edit-fail', error)
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

  <DialogUnsavedBlock
    :blockRedirectUnsaved="formHasChanges"
    :isTabs="isTabs"
  />
  <slot
    name="action-bar"
    :onSubmit="onSubmit"
    :formValid="meta.valid"
    :onCancel="onCancel"
    :errors="errors"
    :loading="isSubmitting"
    :values="values"
    :setValues="setValues"
  />
</template>
