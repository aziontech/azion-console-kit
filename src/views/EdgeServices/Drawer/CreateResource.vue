<script setup>
  import { computed, ref, watch } from 'vue'
  import * as ResourcesServices from '@/services/edge-service-resources-services'
  import Sidebar from 'primevue/sidebar'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import RadioButton from 'primevue/radiobutton'
  import InputText from 'primevue/inputtext'
  import ActionBarTemplate from '@/templates/action-bar-block'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useToast } from 'primevue/usetoast'
  import { useAccountStore } from '@/stores/account'

  const emit = defineEmits(['update:visible', 'onSuccess'])

  const props = defineProps({
    visible: {
      type: Boolean,
      default: false
    },
    position: {
      type: String,
      default: 'right'
    },
    edgeServiceID: {
      type: String,
      required: true
    },
    resourceID: {
      type: Number
    }
  })

  const toast = useToast()
  const store = useAccountStore()
  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })
  const editorOptions = {
    minimap: { enabled: false },
    tabSize: 2,
    formatOnPaste: true
  }
  const defaultTrigger = 'Install'
  const contentTypeShellScript = 'Shell Script'

  const loading = ref(false)
  const initialValues = {
    name: '',
    contentType: contentTypeShellScript,
    trigger: defaultTrigger,
    content: ''
  }
  const validationSchema = yup.object({
    name: yup
      .string()
      .required()
      .test('validateFilePath', 'Must be a valid file path', (val) => {
        const isValid = /^(\/\.?[\w][\w.-]*)+$/.test(val)
        return isValid
      })
      .label('Name'),
    contentType: yup.string().required(),
    trigger: yup.string().when('contentType', {
      is: contentTypeShellScript,
      then: (schema) => schema.required()
    }),
    content: yup.string().required().label('Content')
  })
  const { meta, errors, handleSubmit, isSubmitting, setValues, resetForm } = useForm({
    validationSchema,
    initialValues
  })

  const { value: name } = useField('name')
  const { value: contentType } = useField('contentType')
  const { value: trigger, setValue: setTrigger } = useField('trigger')
  const { value: content } = useField('content')

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      resetForm()
      emit('update:visible', value)
    }
  })

  const isShellScript = computed(() => {
    return contentType.value === contentTypeShellScript
  })

  const disabledFields = computed(() => {
    return isSubmitting.value || loading.value
  })

  const titleDrawer = computed(() => {
    return props.resourceID ? 'Edit Resource' : 'Create Resource'
  })

  const toggleDrawerVisibility = (isVisible) => {
    visibleDrawer.value = isVisible
  }

  const closeDrawer = () => {
    toggleDrawerVisibility(false)
  }

  const showToast = (severity, summary) => {
    if (!summary) return
    toast.add({
      closable: true,
      severity: severity,
      summary: summary
    })
  }

  const editResource = async (payload) => {
    const response = await ResourcesServices.editResourcesServices({
      ...payload,
      edgeServiceID: props.edgeServiceID,
      resourcesID: props.resourceID
    })

    emit('onSuccess', response)
    showToast('success', response)
  }

  const createResource = async (payload) => {
    const response = await ResourcesServices.createResourcesServices({
      ...payload,
      edgeServiceID: props.edgeServiceID
    })

    emit('onSuccess', response)
    showToast('success', response.feedback)
  }

  const loadResource = async () => {
    const { edgeServiceID, resourceID } = props
    loading.value = true

    try {
      const response = await ResourcesServices.loadResourcesServices({
        edgeServiceID,
        resourcesID: resourceID
      })

      setValues(response)
    } catch (error) {
      closeDrawer()
      showToast('error', error)
    } finally {
      loading.value = false
    }
  }

  const handleShellScriptOption = () => {
    setTrigger(trigger.value || defaultTrigger)
  }

  const onSubmit = handleSubmit(async (values, actions) => {
    try {
      const onService = props.resourceID ? editResource : createResource
      await onService(values)
      actions.resetForm()
      toggleDrawerVisibility(false)
    } catch (error) {
      showToast('error', error)
    }
  })

  watch(
    () => props.resourceID,
    async (value) => {
      if (value) {
        await loadResource()
      }
    },
    { immediate: true }
  )
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
      <div>{{ titleDrawer }}</div>
    </template>
    <div class="flex w-full md:p-8 pb-0">
      <form class="w-full flex flex-col gap-8">
        <form-horizontal
          :isDrawer="true"
          title="Resource"
          description="To be able to orchestrate services on your device, you must configure
          the resources needed to install, uninstall, and reload your services."
        >
          <template #inputs>
            <div class="flex flex-col w-full sm:max-w-3xl gap-2">
              <div class="flex flex-col gap-2">
                <div class="flex flex-col sm:max-w-lg w-full gap-2">
                  <label
                    for="name"
                    class="text-color text-sm not-italic font-medium leading-5"
                    >Path *</label
                  >
                  <InputText
                    v-model="name"
                    type="text"
                    :class="{ 'p-invalid': errors.name }"
                    :disabled="disabledFields"
                  />
                  <small class="text-color-secondary text-sm font-normal leading-tight">
                    The absolute path of the resource.
                  </small>
                  <small
                    v-if="errors.name"
                    class="p-error text-xs font-normal leading-tight"
                    >{{ errors.name }}</small
                  >
                </div>
              </div>
            </div>
            <div class="flex flex-col w-full sm:max-w-3xl gap-2">
              <div class="flex flex-col gap-2">
                <label class="text-color text-sm not-italic font-medium leading-5">Type *</label>
                <div class="flex flex-col gap-3">
                  <div class="flex no-wrap gap-2 items-center">
                    <RadioButton
                      v-model="contentType"
                      inputId="shell-script"
                      name="shell-script"
                      value="Shell Script"
                      @change="handleShellScriptOption"
                      :disabled="disabledFields"
                    />
                    <label
                      for="shell-script"
                      class="text-color text-sm font-normal leading-tight"
                      >Shell Script</label
                    >
                  </div>
                  <div class="flex no-wrap gap-2 items-center">
                    <RadioButton
                      v-model="contentType"
                      inputId="content-type-text"
                      name="content-type-text"
                      value="Text"
                      :disabled="disabledFields"
                    />
                    <label
                      for="content-type-text"
                      class="text-color text-sm font-normal leading-tight"
                      >Text
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div
              class="flex flex-col w-full sm:max-w-3xl gap-2"
              v-if="isShellScript"
            >
              <div class="flex flex-col gap-2">
                <label class="text-color text-sm not-italic font-medium leading-5"
                  >Trigger Type *</label
                >
                <small class="text-color-secondary text-xs not-italic font-normal leading-5">
                  Action performed when the resource state changes in the edge node. For example, a
                  resource with an install trigger is executed the first time it is copied to the
                  edge node.
                </small>
                <div class="flex flex-col gap-3">
                  <div class="flex no-wrap gap-2 items-center">
                    <RadioButton
                      v-model="trigger"
                      :disabled="disabledFields"
                      inputId="trigger-install"
                      name="trigger-install"
                      value="Install"
                    />
                    <label
                      for="trigger-install"
                      class="text-color text-sm font-normal leading-tight"
                      >Install</label
                    >
                  </div>
                  <div class="flex no-wrap gap-2 items-center">
                    <RadioButton
                      v-model="trigger"
                      :disabled="disabledFields"
                      inputId="trigger-reload"
                      name="trigger-reload"
                      value="Reload"
                    />
                    <label
                      for="trigger-reload"
                      class="text-color text-sm font-normal leading-tight"
                      >Reload
                    </label>
                  </div>
                  <div class="flex no-wrap gap-2 items-center">
                    <RadioButton
                      v-model="trigger"
                      :disabled="disabledFields"
                      inputId="trigger-uninstall"
                      name="trigger-uninstall"
                      value="Uninstall"
                    />
                    <label
                      for="trigger-uninstall"
                      class="text-color text-sm font-normal leading-tight"
                      >Uninstall
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col w-full sm:max-w-3xl gap-2">
              <div class="flex flex-col gap-2">
                <div class="flex flex-col w-full gap-2">
                  <label
                    for="name"
                    class="text-color text-sm not-italic font-medium leading-5"
                    >Content *</label
                  >
                  <div class="flex flex-col h-full gap-2">
                    <vue-monaco-editor
                      v-model:value="content"
                      language="shell"
                      :disabled="disabledFields"
                      :theme="theme"
                      class="min-h-[200px] overflow-clip surface-border border rounded-md"
                      :class="{ 'border-red-500 border': errors.content }"
                      :options="editorOptions"
                    />
                    <small
                      v-if="errors.content"
                      class="p-error text-xs font-normal leading-tight"
                    >
                      {{ errors.content }}
                    </small>
                    <small class="text-color-secondary text-xs not-italic font-normal leading-5">
                      The content of the resource to be copied to the edge node.
                      <strong>Shell Script</strong> resources must carry a <code>sh-bang</code> in
                      the content header. In the absence of one, the POSIX-compliant shell on the
                      device (<code>/bin/sh</code>) will be used.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </form-horizontal>
      </form>
    </div>
    <div class="sticky bottom-0">
      <action-bar-template
        @onCancel="closeDrawer"
        @onSubmit="onSubmit"
        :loading="isSubmitting"
        :submitDisabled="!meta.valid || disabledFields"
      />
    </div>
  </Sidebar>
</template>
