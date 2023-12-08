<script setup>
  import { computed, ref } from 'vue'
  import { useForm } from 'vee-validate'
  import { useToast } from 'primevue/usetoast'
  import ActionBarBlock from '@/templates/action-bar-block'
  import Sidebar from 'primevue/sidebar'

  defineOptions({
    name: 'create-drawer-block'
  })

  const emit = defineEmits(['update:visible', 'onSuccess'])
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
    }
  })

  const toast = useToast()
  const { meta, resetForm, isSubmitting, handleSubmit } = useForm({
    validationSchema: props.schema,
    initialValues: props.initialValues
  })
  const loading = ref(false)

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      resetForm()
      emit('update:visible', value)
    }
  })

  const isLoading = computed(() => {
    return isSubmitting.value || loading.value
  })

  const disableFields = computed(() => {
    return !meta.value.valid || loading.value
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

  const onSubmit = handleSubmit(async (values, formContext) => {
    try {
      loading.value = true
      const response = await props.createService(values)
      emit('onSuccess', response)
      showToast('success', response.feedback)
      formContext.resetForm()
      toggleDrawerVisibility(false)
    } catch (error) {
      showToast('error', error)
    } finally {
      loading.value = false
    }
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
      <form class="w-full flex flex-col gap-8">
        <slot name="formFields" />
      </form>
    </div>
    <div class="sticky bottom-0">
      <ActionBarBlock
        @onCancel="closeDrawer"
        @onSubmit="onSubmit"
        :inDrawer="true"
        :loading="isLoading"
        :submitDisabled="disableFields"
      />
    </div>
  </Sidebar>
</template>
