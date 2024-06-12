<script setup>
  import { useAccountStore } from '@/stores/account'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Dropdown from 'primevue/dropdown'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'
  defineOptions({ name: 'form-fields-drawer-service' })

  const props = defineProps({
    listServices: {
      type: Array,
      required: true
    },
    disabledFields: {
      type: Boolean,
      default: false
    }
  })

  const { value: service } = useField('service')
  const { value: variables, errorMessage: variablesError } = useField('variables')

  const editorOptions = computed(() => {
    return {
      minimap: { enabled: false },
      tabSize: 2,
      formatOnPaste: true,
      readOnly: props.disabledFields
    }
  })

  const store = useAccountStore()
  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })
</script>

<template>
  <form-horizontal
    :isDrawer="true"
    title="Services"
    description="Provision services created in the Edge Service library and customize variables."
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <div class="flex flex-col gap-2">
          <div class="flex w-80 sm:max-w-lg flex-col items-start gap-2">
            <label
              for="name"
              class="text-color text-sm not-italic font-medium leading-5"
              >Service *</label
            >
            <Dropdown
              filter
              autoFilterFocus
              appendTo="self"
              class="flex self-stretch"
              v-model="service"
              :options="props.listServices"
              :loading="props.listServices.length === 0"
              :disabled="props.disabledFields"
              optionLabel="name"
              placeholder="Select"
            />
            <small class="text-xs text-color-secondary font-normal leading-5">
              Select the service to be provisioned.
            </small>
          </div>
        </div>
      </div>
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <div class="flex flex-col gap-2">
          <div class="flex flex-col w-full gap-2">
            <label class="text-color text-sm not-italic font-medium leading-5">Variables</label>
            <div class="flex flex-col h-full gap-2">
              <vue-monaco-editor
                v-model:value="variables"
                language="shell"
                :theme="theme"
                class="min-h-[200px] overflow-clip surface-border border rounded-md"
                :class="{ 'border-red-500 border': variablesError }"
                :options="editorOptions"
              />
              <small
                v-if="variablesError"
                class="p-error text-xs font-normal leading-tight"
              >
                {{ variablesError }}
              </small>
              <small class="text-xs text-color-secondary font-normal leading-5">
                Customize or keep the default values of the variables required to run the service.
              </small>
            </div>
          </div>
        </div>
      </div>
    </template>
  </form-horizontal>
</template>
