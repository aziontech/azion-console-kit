<script setup>
  import { computed, ref, provide, nextTick, watch } from 'vue'
  import { useForm, useIsFormDirty } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'
  import ActionBarBlock from '@/templates/action-bar-block'
  import GoBack from '@/templates/action-bar-block/go-back'
  import Sidebar from 'primevue/sidebar'
  import ConsoleFeedback from '@/layout/components/navbar/feedback'
  import DialogUnsavedBlock from '@/templates/dialog-unsaved-block'
  import PrimeButton from 'primevue/button'
  import { capitalizeFirstLetter } from '@/helpers'
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
    drawerId: {
      type: String,
      default: 'create-drawer-block'
    },
    isOverlapped: {
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
    },
    disableToast: {
      type: Boolean,
      default: false
    },
    expandable: {
      type: Boolean,
      default: false
    },
    expandedDefault: {
      type: Boolean,
      default: false
    }
  })

  const { scrollToErrorInDrawer } = useScrollToError()
  const toast = useToast()
  const showGoBack = ref(false)
  const blockViewRedirection = ref(true)
  const isInitializing = ref(true)
  const formDrawerHasUpdated = ref(false)
  const isExpanded = ref(props.expandedDefault)

  const toggleExpandDrawer = () => {
    isExpanded.value = !isExpanded.value
  }

  const { resetForm, isSubmitting, handleSubmit, errors } = useForm({
    validationSchema: props.schema,
    initialValues: props.initialValues
  })

  const isDirty = useIsFormDirty()

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
    return blockViewRedirection.value && isDirty.value && !isInitializing.value
  })

  watch(
    () => props.visible,
    async (isVisible) => {
      if (isVisible) {
        isInitializing.value = true
        await nextTick()
        setTimeout(() => {
          isInitializing.value = false
        }, 100)
      }
    }
  )

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

  const showToast = (severity, summary) => {
    const options = {
      closable: true,
      severity: severity,
      summary: capitalizeFirstLetter(severity),
      detail: summary
    }

    toast.add(options)
  }

  const showToastWithActions = (toastData) => {
    const options = {
      closable: true,
      severity: 'success',
      summary: 'Success',
      detail: toastData.feedback,
      additionalDetails: toastData?.additionalFeedback,
      action: toastData?.actions
    }

    toast.add(options)
  }

  const onSubmit = handleSubmit(
    async (values, formContext) => {
      try {
        const response = await props.createService(values)
        blockViewRedirection.value = false
        emit('onSuccess', { ...response, showToastWithActions })
        if (!props.disableToast) showToast('success', response?.feedback)
        showGoBack.value = props.showBarGoBack
        if (showGoBack.value) {
          blockViewRedirection.value = true
          return
        }
        isInitializing.value = true
        formContext.resetForm()
        await nextTick()
        setTimeout(() => {
          isInitializing.value = false
        }, 100)
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
          class: [
            'w-full',
            'transition-all',
            'duration-300',
            'ease-in-out',
            {
              'max-w-5xl': !isExpanded && props.isOverlapped,
              'max-w-4xl': !isExpanded && !props.isOverlapped
            }
          ]
        },
        headercontent: { class: 'flex justify-content-between items-center w-full pr-2' },
        content: { class: 'p-8' }
      }"
    >
      <template #header>
        <h2>{{ title }}</h2>
        <div class="flex items-center gap-2">
          <ConsoleFeedback styleTextColor="text-color" />
          <PrimeButton
            v-if="expandable"
            @click="toggleExpandDrawer"
            outlined
            :icon="isExpanded ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
          />
        </div>
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
      <div class="fixed w-full left-0 bottom-0 z-10">
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
            :data-testid="`${drawerId}__action-bar`"
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
  </Teleport>
</template>
