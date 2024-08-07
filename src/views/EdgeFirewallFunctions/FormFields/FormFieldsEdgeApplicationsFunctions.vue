<script setup>
  import { useAccountStore } from '@/stores/account'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import { useField } from 'vee-validate'
  import { computed } from 'vue'

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
    description="Instantiate an edge function within your edge firewall. Use Rules Engine to activate the function."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          v-model="name"
          description="Give a unique and descriptive name to identify the edge firewall function instance."
          placeholder="My edge firewall function instance"
          data-testid="edge-firewall-functions-form__name-field"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Edge Function"
    description="Select an existing edge function and customize the arguments. Only edge functions previously created in the Edge Functions module can be instantiated."
  >
    <template #inputs>
      <div class="flex w-80 flex-col gap-2 sm:max-w-lg max-sm:w-full">
        <FieldDropdown
          label="Edge Function"
          required
          name="edgeFunctionID"
          :options="edgeFunctionsList"
          @onChange="changeArgs"
          :value="edgeFunctionID"
          optionLabel="label"
          optionValue="value"
          :optionDisabled="(option) => option.disabled"
          filter
          appendTo="self"
          data-testid="edge-firewall-functions-form__edge-function-dropdown"
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
          language="json"
          :theme="theme"
          :options="editorOptions"
          class="min-h-[200px] overflow-clip surface-border border rounded-md"
          data-testid="edge-firewall-functions-form__arguments-field__editor"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Customize the arguments in JSON format. Once set, they can be called in code using
          <code>event.args("arg_name")</code>.
        </small>
      </div>
    </template>
  </FormHorizontal>
</template>
