<script setup>
  import { computed, onBeforeMount, ref, provide } from 'vue'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'
  import Sidebar from 'primevue/sidebar'
  import Skeleton from 'primevue/skeleton'
  import ShareUrl from '@/layout/components/navbar/share-url'
  import ConsoleFeedback from '@/layout/components/navbar/feedback'
  import ActionBarBlock from '@/templates/action-bar-block'
  import GoBack from '@/templates/action-bar-block/go-back'
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import { useScrollToError } from '@/composables/useScrollToError'
  import { capitalizeFirstLetter } from '@/helpers'

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
    isOverlapped: {
      type: Boolean,
      default: false
    },
    loadService: {
      type: Function,
      required: true
    },
    editService: {
      type: Function,
      default: () => {}
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
    },
    showShareUrl: {
      type: Boolean,
      default: false
    }
  })

  const { meta, errors, handleSubmit, isSubmitting, values, resetForm } = useForm({
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
        changeVisibleDrawer(!value, false)
        return
      }
      changeVisibleDrawer(value, true)
    }
  })

  const formHasChanges = computed(() => {
    const isDirty = useIsFormDirty()
    return blockViewRedirection.value && isDirty.value
  })

  const changeVisibleDrawer = (isVisible, isResetForm) => {
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
      summary: capitalizeFirstLetter(severity),
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

        const toastMessage =
          typeof feedback === 'object' && feedback?.feedback ? feedback.feedback : feedback
        showToast('success', toastMessage)
        showGoBack.value = props.showBarGoBack
        if (showGoBack.value) {
          blockViewRedirection.value = false
          return
        }
        formContext.resetForm()
        toggleDrawerVisibility(false)
      } catch (error) {
        blockViewRedirection.value = true
        // Check if error is an ErrorHandler instance (from v2 services)
        if (error && typeof error.showErrors === 'function') {
          error.showErrors(toast)
          emit('onError', error.message[0])
        } else {
          // Fallback for legacy errors or non-ErrorHandler errors
          const errorMessage = error?.message || error
          emit('onError', errorMessage)
          showToast('error', errorMessage)
        }
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
    changeVisibleDrawer,
    formDrawerHasUpdated
  })
</script>

<template>
  <Teleport to="body">
    <Sidebar
      v-model:visible="visibleDrawer"
      :update:visible="toggleDrawerVisibility"
      position="right"
      :pt="{
        root: {
          class: `w-full transition-all duration-300 ease-in-out ${
            props.isOverlapped ? 'max-w-5xl' : 'max-w-4xl'
          }`
        },
        headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
        content: { class: 'p-8' }
      }"
    >
      <template #header>
        <h2>{{ title }}</h2>
        <div class="flex gap-2">
          <ConsoleFeedback />
          <ShareUrl v-if="showShareUrl" />
        </div>
      </template>
      <div class="pb-16 w-full space-y-8">
        <div
          v-if="loading"
          class="w-full flex flex-col gap-8 z-5"
        >
          <fieldset
            v-for="n in 3"
            :key="n"
            class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section px-8 py-8 rounded-md flex-wrap min-w-[2rem] border surface-border"
          >
            <!-- Title and Description Skeleton -->
            <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[15rem]">
              <Skeleton class="h-7 w-32" />
              <Skeleton class="h-4 w-full max-w-sm" />
            </div>
            <!-- Inputs Skeleton -->
            <div class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6">
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <Skeleton class="h-5 w-32" />
                <Skeleton class="h-10 w-full" />
                <Skeleton class="h-3 w-full max-w-xs" />
              </div>
            </div>
          </fieldset>
        </div>
        <!-- Form Content -->
        <div v-show="!loading">
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
      </div>
      <div class="w-full fixed left-0 bottom-0 z-1">
        <slot
          name="action-bar"
          :onSubmit="onSubmit"
          :formValid="meta.valid"
          :errors="errors"
          :loading="isSubmitting"
          :values="values"
          :onCancel="closeDrawer"
          :handleSubmit="handleSubmit"
          :scrollToErrorInDrawer="scrollToErrorInDrawer"
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
            :loading="isLoading"
          />
        </slot>
      </div>
    </Sidebar>
    <DialogUnsavedBlock
      :blockRedirectUnsaved="formHasChanges"
      :isDrawer="true"
    />
  </Teleport>
</template>
