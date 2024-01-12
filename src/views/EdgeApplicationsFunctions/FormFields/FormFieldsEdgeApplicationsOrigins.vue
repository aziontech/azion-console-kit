<script setup>
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'
  import { useAccountStore } from '@/stores/account'

  defineProps({
    edgeFunctionsList: {
      required: true,
      type: Array
    }
  })

  const store = useAccountStore()

  const editorOptions = computed(() => {
    return {
      minimap: { enabled: false },
      tabSize: 2,
      formatOnPaste: true
    }
  })

  const { value: name } = useField('name')
  const { value: edgeFunctionID } = useField('edgeFunctionID')
  const { value: args } = useField('args')
  
  const theme = computed(() => {
    return store.currentTheme === 'light' ? 'vs' : 'vs-dark'
  })
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Instantiate an edge function within your edge application."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <InputText
          label="Name *"
          name="name"
          v-model="name"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Function Instanced"
    description="Description. Informar que para criar novas functions para serem instanciadas, o usuário precisa ir em Edge Functions."
  >
    <template #inputs>
      <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
        <label
          for="edgeFunctionID"
          class="text-color text-sm font-medium leading-5"
          >Edge Function *</label
        >
        <Dropdown
          inputId="edgeFunctionID"
          v-model="edgeFunctionID"
          :options="edgeFunctionsList"
          optionLabel="label"
          option-value="value"
          :optionDisabled="(option) => option.disabled"
        />
      </div>

      <div class="flex flex-col gap-2 w-full">
        <label
          for="arguments"
          class="text-color text-sm font-medium leading-5"
          >Arguments</label
        >
        <vue-monaco-editor
          v-model:value="args"
          language="javascript"
          :theme="theme"
          :options="editorOptions"
          class="min-h-[200px] overflow-clip surface-border border rounded-md"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
