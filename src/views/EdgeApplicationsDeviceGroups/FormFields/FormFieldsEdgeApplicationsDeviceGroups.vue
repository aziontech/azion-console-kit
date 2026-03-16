<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { useField } from 'vee-validate'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldTextArea from '@aziontech/webkit/field-text-area'

  const { value: name } = useField('name')
  const { value: userAgent } = useField('userAgent')
</script>

<template>
  <FormHorizontal
    :isDrawer="true"
    title="General"
    description="Edit the device group main settings."
  >
    <template #inputs>
      <FieldText
        label="Name"
        required
        name="name"
        :value="name"
        placeholder="My device group"
        description="Give a unique and descriptive name to identify the device group."
      />
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="Match to User-Agent"
    description="Specify a regular expression to compare with the contents of the User-Agent header."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldTextArea
          label="Regular Expression"
          required
          placeholder="(Mobile|iP(hone|od)|BlackBerry|IEMobile)"
          name="userAgent"
          :value="userAgent"
          description="Add the regular expression you want to match to the content of the User-Agent header."
        />
      </div>
    </template>
  </FormHorizontal>
</template>
