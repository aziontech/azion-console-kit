<template>
  <div>
    <TabView>
      <TabPanel header="Code">
        <EditFormBlock
          pageTitle="Edit Edge Functions"
          :editService="props.editEdgeFunctionsService"
          :loadService="props.loadEdgeFunctionsService"
          :initialDataSetter="setValues"
          :isValid="meta.valid"
          :formData="values"
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
        </EditFormBlock>
      </TabPanel>
      <TabPanel header="Arguments">
        <EditFormBlock
          pageTitle="Edit Edge Functions"
          :editService="props.editEdgeFunctionsService"
          :loadService="props.loadEdgeFunctionsService"
          :initialDataSetter="setValues"
          :isValid="meta.valid"
          :formData="values"
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
        </EditFormBlock>
      </TabPanel>
      <TabPanel header="Preview">
        <EditFormBlock
          pageTitle="Edit Edge Functions"
          :editService="props.editEdgeFunctionsService"
          :loadService="props.loadEdgeFunctionsService"
          :initialDataSetter="setValues"
          :isValid="meta.valid"
          :formData="values"
        >
          <template #form>
            <p class="flex items-center justify-center min-h-[35vh]">
              No Preview Available...
              </p>
          </template>
        </EditFormBlock>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import InputText from 'primevue/inputtext'

  const props = defineProps({
    loadEdgeFunctionsService: {
      type: Function,
      required: true
    },
    editEdgeFunctionsService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required()
  })
  const ARGS_INITIAL_STATE = '{}'

  const { setValues, defineInputBinds, errors, meta, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      active: true,
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
