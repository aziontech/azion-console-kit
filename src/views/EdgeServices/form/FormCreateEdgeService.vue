<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'
  import { useAccountStore } from '@/stores/account'

  const { value: name, errorMessage: nameError } = useField('name')
  const { value: active } = useField('active')
  const { value: code } = useField('code')

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
    description="description"
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
        />
        <small
          v-if="nameError"
          class="p-error text-xs font-normal leading-tight"
          >{{ nameError }}</small
        >
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Variables"
    description="Variables are dynamic values that affect the Services' orchestration. They are reserved spaces for stored information within the system that passes on data to the orchestration scripts. For example: port=3306."
  >
    <template #inputs>
      <vue-monaco-editor
        v-model:value="code"
        language="shell"
        :theme="theme"
        class="min-h-[200px] overflow-clip surface-border border rounded-md"
        :options="editorOptions"
      />
    </template>
  </FormHorizontal>
  <FormHorizontal title="Status">
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <div
          class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
        >
          <span class="p-input-icon-right w-full flex max-w-lg items-start gap-2 pb-3 pt-2">
            <InputSwitch
              v-model="active"
              inputId="activeStatus"
            />
            <label
              for="activeStatus"
              class="text-color text-sm font-normal leading-5"
              >Active</label
            >
          </span>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
