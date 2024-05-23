<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import InputText from 'primevue/inputtext'
  import { computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-edge-service' })

  const { value: name, errorMessage: nameError } = useField('name')
  const { value: code, errorMessage: codeError } = useField('code')
  useField('active')

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
  <FormHorizontal
    title="General"
    description="Services define dependencies between resources."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *</label
        >
        <InputText
          v-model="name"
          type="text"
          :class="{ 'p-invalid': nameError }"
          placeholder="My service"
        />
        <small
          v-if="nameError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ nameError }}
        </small>
        <small class="text-xs text-color-secondary font-normal leading-5">
          Give a unique and descriptive name to identify the service.
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Variables"
    description="Variables are dynamic values that affect the edge services that will be orchestrated and run on Edge Nodes."
  >
    <template #inputs>
      <div class="flex flex-col h-full gap-2">
        <vue-monaco-editor
          v-model:value="code"
          language="shell"
          :theme="theme"
          class="min-h-[200px] overflow-clip surface-border border rounded-md"
          :class="{ 'border-red-500 border': codeError }"
          :options="editorOptions"
        />
        <small
          v-if="codeError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ codeError }}
        </small>
        <small class="text-xs text-color-secondary font-normal leading-5">
          Enter the list of variables and values for the resource. Example:
          <code>port=3306</code>.
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal title="Status">
    <template #inputs>
      <FieldSwitchBlock
        nameField="active"
        name="active"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </FormHorizontal>
</template>
