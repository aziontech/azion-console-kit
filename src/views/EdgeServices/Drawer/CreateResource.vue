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
  const loading = ref(false)
  const initialValues = {
    name: '',
    contentType: 'Shell Script',
    trigger: 'Install',
    content: ''
  }

  const validationSchema = yup.object({
    name: yup
      .string()
      .required()
      .test('validateFilePath', 'Must be a valid file path', (val) => {
        const isValid = /^(\/\.?[\w][\w.-]*)+$/.test(val)
        return isValid
      }),
    contentType: yup.string().required(),
    trigger: yup.string().required(),
    content: yup.string().required()
  })
  const { meta, errors, handleSubmit, isSubmitting, setValues, resetForm } = useForm({
    validationSchema,
    initialValues
  })

  const { value: name } = useField('name')
  const { value: contentType } = useField('contentType')
  const { value: trigger } = useField('trigger')
  const { value: content } = useField('content')

  const visibleDrawer = computed({
    get: () => props.visible,
    set: (value) => {
      resetForm()
      emit('update:visible', value)
    }
  })

  const disabledFields = computed(() => {
    return isSubmitting.value || loading.value
  })

  const openDrawer = (value) => {
    visibleDrawer.value = value
  }

  const closeSideBar = () => {
    openDrawer(false)
    visibleDrawer.value = false
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

    emit('onSuccess')
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
    loading.value = true
    const response = await ResourcesServices.loadResourcesServices({
      edgeServiceID: props.edgeServiceID,
      resourcesID: props.resourceID
    })

    setValues(response)
    loading.value = false
  }

  const onSubmit = handleSubmit(async (values, actions) => {
    try {
      const onService = props.resourceID ? editResource : createResource
      await onService(values)
      actions.resetForm()
      openDrawer(false)
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
    :update:visible="openDrawer"
    :position="props.position"
    :pt="{
      root: { class: 'max-w-4xl w-full p-0' },
      header: { class: 'flex justify-between text-xl font-medium px-8' },
      closeButton: { class: 'border surface-border' },
      content: { class: '[&::-webkit-scrollbar]:hidden p-0 flex flex-col justify-between' }
    }"
  >
    <template #header>
      <div>New Resource</div>
    </template>
    <div class="w-full flex flex-col p-8">
      <form class="w-full flex flex-col gap-8 mb-5">
        <form-horizontal
          :isDrawer="true"
          title="Resource Settingn"
          description="Description"
        >
          <template #inputs>
            <div class="flex flex-col w-full sm:max-w-3xl gap-2">
              <div class="flex flex-col gap-2">
                <div class="flex flex-col sm:max-w-lg w-full gap-2">
                  <label
                    for="name"
                    class="text-color text-sm not-italic font-medium leading-5"
                    >Filepath*</label
                  >
                  <InputText
                    v-model="name"
                    type="text"
                    :class="{ 'p-invalid': errors.name }"
                    :disabled="disabledFields"
                  />
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
                <label class="text-color text-sm not-italic font-medium leading-5">Type*</label>
                <div class="flex flex-col gap-3">
                  <div class="flex no-wrap gap-2 items-center">
                    <RadioButton
                      v-model="contentType"
                      inputId="shell-script"
                      name="shell-script"
                      value="Shell Script"
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
              v-if="contentType === 'Shell Script'"
            >
              <div class="flex flex-col gap-2">
                <label class="text-color text-sm not-italic font-medium leading-5"
                  >Trigger Type*</label
                >
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
                <small class="text-color-secondary text-xs not-italic font-normal leading-5">
                  Defines actions performed when the resource state changes in the Edge Node. For
                  example, a resource with an Install trigger is executed the first time it is
                  copied to the Edge Node.
                </small>
              </div>
            </div>
            <div class="flex flex-col w-full sm:max-w-3xl gap-2">
              <div class="flex flex-col gap-2">
                <div class="flex flex-col w-full gap-2">
                  <label
                    for="name"
                    class="text-color text-sm not-italic font-medium leading-5"
                    >Content*</label
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
                      The content of the resource, to be copied to the Edge Node. When the type is
                      “Shell Script”, it must be a valid POSIX shell script. If you want it to work
                      with resource content variables, you must add .
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
        @onCancel="closeSideBar"
        @onSubmit="onSubmit"
        :loading="isSubmitting"
        :submitDisabled="!meta.valid"
      />
    </div>
  </Sidebar>
</template>
