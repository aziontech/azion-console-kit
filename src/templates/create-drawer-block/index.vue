<script setup>
  import { computed, ref, provide } from 'vue'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'
  import ActionBarBlock from '@/templates/action-bar-block'
  import GoBack from '@/templates/action-bar-block/go-back'
  import Sidebar from 'primevue/sidebar'
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'

  defineOptions({
    name: 'create-drawer-block'
  })

  const emit = defineEmits(['update:visible', 'onSuccess', 'onError'])
  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    createService: {
      type: Function,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    schema: {
      type: Object,
      required: true
    },
    initialValues: {
      type: Object,
      required: true
    },
    showBarGoBack: {
      type: Boolean,
      default: false
    }
  })

  const toast = useToast()
  const showGoBack = ref(false)
  const blockViewRedirection = ref(true)
  const formDrawerHasUpdated = ref(false)

  const { meta, resetForm, isSubmitting, handleSubmit } = useForm({
    validationSchema: props.schema,
    initialValues: props.initialValues
  })

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      if (formHasChanges.value) {
        formDrawerHasUpdated.value = !formDrawerHasUpdated.value
        changeVisisbleDrawer(!value, false)
        return
      }
      changeVisisbleDrawer(value, true)
    }
  })

  const disableFields = computed(() => {
    return !meta.value.valid || isSubmitting.value
  })

  const formHasChanges = computed(() => {
    const isDirty = useIsFormDirty()
    return blockViewRedirection.value && isDirty.value
  })

  const changeVisisbleDrawer = (isVisible, isResetForm) => {
    emit('update:visible', isVisible)
    if (isResetForm) resetForm()
  }

  const toggleDrawerVisibility = (isVisible) => {
    visibleDrawer.value = isVisible
  }

  const closeDrawer = () => {
    toggleDrawerVisibility(false)
  }

  const showToast = (severity, summary) => {
    toast.add({
      closable: true,
      severity: severity,
      summary: severity,
      detail: summary
    })
  }

  const onSubmit = handleSubmit(async (values, formContext) => {
    try {
      const response = await props.createService(values)
      blockViewRedirection.value = false
      emit('onSuccess', response)
      showToast('success', response.feedback)
      showGoBack.value = props.showBarGoBack
      if (showGoBack.value) {
        blockViewRedirection.value = true
        return
      }
      formContext.resetForm()
      toggleDrawerVisibility(false)
    } catch (error) {
      blockViewRedirection.value = true
      emit('onError', error)
      showToast('error', error)
    }
  })

  const handleGoBack = () => {
    showGoBack.value = false
    toggleDrawerVisibility(false)
  }

  provide('drawerUnsaved', {
    changeVisisbleDrawer,
    formDrawerHasUpdated
  })
</script>

<template>
  <Sidebar
    v-model:visible="visibleDrawer"
    :update:visible="toggleDrawerVisibility"
    position="right"
    :pt="{
      root: { class: 'max-w-4xl w-full p-0' },
      header: { class: 'flex justify-between text-xl font-medium px-8' },
      closeButton: { class: 'border surface-border' },
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between' }
    }"
  >
    <template #header>
      <h2>{{ title }}</h2>
    </template>
    <div class="flex w-full md:p-8 pb-0">
      <form
        @submit.prevent="handleSubmit"
        class="w-full flex flex-col gap-8"
      >
        <slot
          name="formFields"
          :disabledFields="isSubmitting"
        />
      </form>
    </div>
    <div class="sticky bottom-0">
      <GoBack
        :goBack="handleGoBack"
        v-if="showGoBack"
        :inDrawer="true"
      />
      <ActionBarBlock
        v-else
        @onCancel="closeDrawer"
        @onSubmit="onSubmit"
        :inDrawer="true"
        :loading="isSubmitting"
        :submitDisabled="disableFields"
      />
    </div>
  </Sidebar>
  <DialogUnsavedBlock
    :blockRedirectUnsaved="formHasChanges"
    :isDrawer="true"
  />
</template>
