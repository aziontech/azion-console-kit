<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import RadioButton from 'primevue/radiobutton'
  import InputText from 'primevue/inputtext'
  import { computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-drawer-resource' })

  const props = defineProps({
    disabledFields: {
      type: Boolean,
      default: false
    }
  })

  const store = useAccountStore()
  const defaultTrigger = 'Install'
  const contentTypeShellScript = 'Shell Script'

  const editorOptions = computed(() => {
    return {
      minimap: { enabled: false },
      tabSize: 2,
      formatOnPaste: true,
      readOnly: props.disabledFields
    }
  })
  const { value: name, errorMessage: nameError } = useField('name')
  const { value: contentType } = useField('contentType')
  const { value: trigger, setValue: setTrigger } = useField('trigger')
  const { value: content, errorMessage: contentError } = useField('content')

  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })

  const isShellScript = computed(() => {
    return contentType.value === contentTypeShellScript
  })

  const handleShellScriptOption = () => {
    setTrigger(trigger.value || defaultTrigger)
  }
</script>

<template>
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
              >Filepath *</label
            >
            <InputText
              v-model="name"
              type="text"
              :class="{ 'p-invalid': nameError }"
              :disabled="props.disabledFields"
            />
            <small
              v-if="nameError"
              class="p-error text-xs font-normal leading-tight"
              >{{ nameError }}</small
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
                :disabled="props.disabledFields"
                @change="handleShellScriptOption"
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
                :disabled="props.disabledFields"
                value="Text"
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
          <label class="text-color text-sm not-italic font-medium leading-5">Trigger Type *</label>
          <div class="flex flex-col gap-3">
            <div class="flex no-wrap gap-2 items-center">
              <RadioButton
                v-model="trigger"
                :disabled="props.disabledFields"
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
                :disabled="props.disabledFields"
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
                :disabled="props.disabledFields"
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
            Defines actions performed when the resource state changes in the Edge Node. For example,
            a resource with an Install trigger is executed the first time it is copied to the Edge
            Node.
          </small>
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
                :theme="theme"
                class="min-h-[200px] overflow-clip surface-border border rounded-md"
                :class="{ 'border-red-500 border': contentError }"
                :options="editorOptions"
              />
              <small
                v-if="contentError"
                class="p-error text-xs font-normal leading-tight"
              >
                {{ contentError }}
              </small>
              <small class="text-color-secondary text-xs not-italic font-normal leading-5">
                The content of the resource, to be copied to the Edge Node. When the type is “Shell
                Script”, it must be a valid POSIX shell script. If you want it to work with resource
                content variables, you must add .
              </small>
            </div>
          </div>
        </div>
      </div>
    </template>
  </form-horizontal>
</template>
