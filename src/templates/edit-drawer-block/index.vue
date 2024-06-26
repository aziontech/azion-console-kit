<script setup>
  import { computed, onBeforeMount, ref, provide } from 'vue'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'
  import ActionBarBlock from '@/templates/action-bar-block'
  import GoBack from '@/templates/action-bar-block/go-back'
  import Sidebar from 'primevue/sidebar'
  import FeedbackFish from '@/templates/navbar-block/feedback-fish'
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { useScrollToError } from '@/composables/useScrollToError'

  defineOptions({
    name: 'edit-drawer-block'
  })

  const emit = defineEmits(['update:visible', 'onSuccess', 'onError'])
  const props = defineProps({
    id: {
      type: [String, Number],
      required: true
    },
    visible: {
      type: Boolean,
      default: false
    },
    loadService: {
      type: Function,
      required: true
    },
    editService: {
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
    disabledCloseDrawer: {
      type: Boolean,
      default: false
    },
    showBarGoBack: {
      type: Boolean,
      default: false
    }
  })

  const { resetForm, isSubmitting, handleSubmit, errors } = useForm({
    validationSchema: props.schema,
    initialValues: props.initialValues
  })

  const { scrollToErrorInDrawer } = useScrollToError()
  const toast = useToast()
  const blockViewRedirection = ref(true)
  const formDrawerHasUpdated = ref(false)
  const loading = ref(false)
  const showGoBack = ref(false)

  const isLoading = computed(() => {
    return isSubmitting.value || loading.value
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

  const showToast = (severity, detail) => {
    if (!detail) return

    const options = {
      closable: true,
      severity,
      summary: severity,
      detail
    }

    toast.add(options)
  }

  const loadInitialData = async () => {
    try {
      loading.value = true
      const initialValues = await props.loadService({ id: props.id })
      resetForm({ values: initialValues })
    } catch (error) {
      emit('onError', error)
      showToast('error', error)
    } finally {
      loading.value = false
    }
  }

  const onSubmit = handleSubmit(
    async (values, formContext) => {
      try {
        const feedback = await props.editService(values)
        blockViewRedirection.value = false
        emit('onSuccess', feedback)
        showToast('success', feedback)
        showGoBack.value = props.showBarGoBack
        if (showGoBack.value) {
          blockViewRedirection.value = false
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

  onBeforeMount(async () => {
    await loadInitialData()
  })

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
      <FeedbackFish />
    </template>
    <div class="pb-16 w-full space-y-8">
      <form
        @submit.prevent="handleSubmit"
        class="w-full flex flex-col gap-8"
      >
        <slot
          name="formFields"
          :errors="errors"
          :disabledFields="isLoading"
        />
      </form>
    </div>
    <div class="w-full fixed left-0 bottom-0">
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
        :loading="isLoading"
      />
    </div>
  </Sidebar>
  <DialogUnsavedBlock
    :blockRedirectUnsaved="formHasChanges"
    :isDrawer="true"
  />
</template>
