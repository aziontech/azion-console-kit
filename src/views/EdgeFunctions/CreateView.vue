<template>
  <div>
    <TabView>
      <TabPanel header="Code">
        <CreateFormBlock
          pageTitle="Create Edge Functions"
          :createService="props.createEdgeFunctionsService"
          :formData="values"
          :isValid="meta.valid"
          :cleanFormCallback="resetForm"
        >
          <template #form>
            <label>Edge Function Name: *</label>
            <InputText
              placeholder="Insert the Edge Functions Name"
              v-bind="name"
              type="text"
              :class="{ 'p-invalid': errors.name }"
              v-tooltip.top="errors.name"
            />

            <label>Function Code: *</label>
            <vue-monaco-editor
              v-model:value="code"
              language="javascript"
              theme="vs-dark"
              class="min-h-[50vh]"
              :class="{ 'border-red-500 border': errorCode }"
              @change="changeValidateCode"
              v-tooltip.top="errorCode"
              :options="{
                tabIndex: 2
              }"
            />
          </template>
        </CreateFormBlock>
      </TabPanel>

      <TabPanel header="Arguments">
        <CreateFormBlock
          pageTitle="Create Edge Functions"
          :createService="props.createEdgeFunctionsService"
          :formData="values"
          :isValid="meta.valid"
          :cleanFormCallback="resetForm"
        >
          <template #form>
            <label>Function Args: *</label>
            <vue-monaco-editor
              v-model:value="jsonArgs"
              language="json"
              theme="vs-dark"
              class="min-h-[50vh]"
              :class="{ 'border-red-500 border': errorCode }"
              @change="changeValidateArgs"
              v-tooltip.top="errorCode"
              :options="{
                formatOnPaste: true
              }"
            />
          </template>
        </CreateFormBlock>
      </TabPanel>

      <TabPanel header="Preview">
        <CreateFormBlock
          pageTitle="Create Edge Functions"
          :createService="props.createIntelligentDNSService"
          :formData="values"
          :isValid="meta.valid"
          :cleanFormCallback="resetForm"
        >
          <template #form>
            <p class="flex items-center justify-center min-h-[35vh]">No Preview Available...</p>
          </template>
        </CreateFormBlock>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import InputText from 'primevue/inputtext'

  const props = defineProps({
    createEdgeFunctionsService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required()
  })
  const ARGS_INITIAL_STATE = '{}'

  const { defineInputBinds, errors, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      active: true,
      language: 'javascript',
      code: `'Type your code here...'`,
      jsonArgs: ARGS_INITIAL_STATE
    }
  })

  const name = defineInputBinds('name', { validateOnInput: true })

  const { value: jsonArgs, setValue: setArgs } = useField('jsonArgs')
  const { value: code } = useField('code')

  let errorCode = ''
  const changeValidateCode = () => {
    errorCode = ''

    if (code.value === '') errorCode = 'code is a required field'
  }

  const changeValidateArgs = () => {
    if (jsonArgs.value === '') setArgs(ARGS_INITIAL_STATE)
  }
</script>
