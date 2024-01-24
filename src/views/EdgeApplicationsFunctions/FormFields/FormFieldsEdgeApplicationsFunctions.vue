<script setup>
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import Dropdown from 'primevue/dropdown'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'
  import { useAccountStore } from '@/stores/account'

  const props = defineProps({
    edgeFunctionsList: {
      required: true,
      type: Array
    }
  })

  const store = useAccountStore()

  const changeArgs = (target) => {
    props.edgeFunctionsList.forEach((element) => {
      if (element.value === target.value) {
        args.value = element.args
      }
    })
  }

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
    description="Instantiate functions created in Edge Functions for the edge application. Use Rules Engine to activate functions."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          name="name"
          v-model="name"
          description="Give a unique and descriptive name to the function you want to instantiate."
          placeholder="My function instance"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Function Instance"
    description="Select the function and customize the arguments."
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
          @change="changeArgs"
          :optionDisabled="(option) => option.disabled"
          filter
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
