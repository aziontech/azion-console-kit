<script setup>
  import { computed, onBeforeMount, ref } from 'vue'
  import { useForm } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'
  import ActionBarBlock from '@/templates/action-bar-block'
  import GoBack from '@/templates/action-bar-block/go-back'
  import Sidebar from 'primevue/sidebar'

  defineOptions({
    name: 'edit-drawer-block'
  })

  const emit = defineEmits(['update:visible', 'onSuccess', 'onError'])
  const props = defineProps({
    id: {
      type: [ String, Number ],
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

  const toast = useToast()
  const { meta, resetForm, isSubmitting, handleSubmit } = useForm({
    validationSchema: props.schema,
    initialValues: props.initialValues
  })
  const loading = ref(false)
  const showGoBack = ref(false)
  const disableEdit = computed(() => {
    return !meta.value.valid || loading.value || isSubmitting.value
  })

  const isLoading = computed(() => {
    return isSubmitting.value || loading.value
  })

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      resetForm()
      emit('update:visible', value)
    }
  })

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
      summary: summary
    })
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

  const onSubmit = handleSubmit(async (values, formContext) => {
    try {
      const feedback = await props.editService(values)
      emit('onSuccess', feedback)
      showToast('success', feedback)
      showGoBack.value = props.showBarGoBack
      if (showGoBack.value) return
      formContext.resetForm()
      toggleDrawerVisibility(false)
    } catch (error) {
      emit('onError', error)
      showToast('error', error)
    }
  })

  const handleGoBack = () => {
    showGoBack.value = false
    toggleDrawerVisibility(false)
  }

  onBeforeMount(async () => {
    await loadInitialData()
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
          :disabledFields="isLoading"
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
        :loading="isLoading"
        :submitDisabled="disableEdit"
      />
    </div>
  </Sidebar>
</template>
