<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import Dropdown from 'primevue/dropdown'
  import { computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { useField } from 'vee-validate'

  const props = defineProps({
    disabledFields: {
      type: Boolean,
      default: false
    },
    listServices: {
      type: Array,
      required: true
    }
  })

  const { value: service } = useField('service')
  const { value: variables, errorMessage: variablesError } = useField('variables')

  const editorOptions = {
    minimap: { enabled: false },
    tabSize: 2,
    formatOnPaste: true
  }

  const store = useAccountStore()
  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })
</script>

<template>
  <form-horizontal
    :isDrawer="true"
    title="Service Settings"
    description="Description"
  >
    <template #inputs>
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <div class="flex flex-col gap-2">
          <!-- <div class="flex flex-col sm:max-w-lg w-full gap-2"> -->
          <div class="flex w-80 sm:max-w-lg flex-col items-start gap-2">
            <label
              for="name"
              class="text-color text-sm not-italic font-medium leading-5"
              >Service *</label
            >
            <Dropdown
              class="flex self-stretch"
              v-model="service"
              :options="listServices"
              :loading="listServices.length === 0"
              optionLabel="name"
              filter
              :disabled="props.disabledFields"
              placeholder="Select"
            />
          </div>
        </div>
      </div>
      <div class="flex flex-col w-full sm:max-w-3xl gap-2">
        <div class="flex flex-col gap-2">
          <div class="flex flex-col w-full gap-2">
            <label class="text-color text-sm not-italic font-medium leading-5"> Variables </label>
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
              <small class="text-color-secondary text-xs not-italic font-normal leading-5">
                You can keep the default values or change the values. These variables are needed to
                run the service.
              </small>
            </div>
          </div>
        </div>
      </div>
    </template>
  </form-horizontal>
</template>
