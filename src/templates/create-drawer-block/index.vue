<script setup>
  import { computed, ref, provide } from 'vue'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'
  import ActionBarBlock from '@/templates/action-bar-block'
  import GoBack from '@/templates/action-bar-block/go-back'
  import Sidebar from 'primevue/sidebar'
  import ConsoleFeedback from '@/templates/navbar-block/feedback'
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'

  import { useScrollToError } from '@/composables/useScrollToError'

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

  const { scrollToErrorInDrawer } = useScrollToError()
  const toast = useToast()
  const showGoBack = ref(false)
  const blockViewRedirection = ref(true)
  const formDrawerHasUpdated = ref(false)

  const { resetForm, isSubmitting, handleSubmit, errors } = useForm({
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
    const options = {
      closable: true,
      severity: severity,
      summary: severity,
      detail: summary
    }

    toast.add(options)
  }

  const onSubmit = handleSubmit(
    async (values, formContext) => {
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
    },
    ({ errors }) => {
      scrollToErrorInDrawer(errors)
    }
  )

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
      root: { class: 'max-w-4xl w-full' },
      headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
      content: { class: 'p-8' }
    }"
  >
    <template #header>
      <h2>{{ title }}</h2>
      <ConsoleFeedback />
    </template>

    <div class="flex w-full">
      <form
        @submit.prevent="handleSubmit"
        class="pb-16 w-full space-y-8"
      >
        <slot
          name="formFields"
          :errors="errors"
          :disabledFields="isSubmitting"
          :closeDrawer="closeDrawer"
        />
      </form>
    </div>
    <div class="fixed w-full left-0 bottom-0">
      <slot
        name="actionBar"
        :goBack="handleGoBack"
        :closeDrawer="closeDrawer"
        :onSubmit="onSubmit"
        :isSubmitting="isSubmitting"
      >
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
        />
      </slot>
    </div>
  </Sidebar>
  <DialogUnsavedBlock
    :blockRedirectUnsaved="formHasChanges"
    :isDrawer="true"
  />
</template>
