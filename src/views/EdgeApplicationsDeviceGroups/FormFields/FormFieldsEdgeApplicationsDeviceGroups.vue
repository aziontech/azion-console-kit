<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { useField } from 'vee-validate'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea';

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
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          placeholder="Insert the Device Group name"
          name="name"
          :value="name"
          description="Give a unique and descriptive name to identify the Device Groups."
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    :isDrawer="true"
    title="User Agent"
    description="Specify a regular expression to compare with the contents of the User-Agent header."
  >
    <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldTextArea 
            label="Refular Expression *"
            placeholder="(Mobile|iP(hone|od)|BlackBerry|IEMobile)"
            name="userAgent"
            :value="userAgent"
            description="Add the regular expression you want to match to the content of the User-Agente header."
          />
        </div>
    </template>
  </FormHorizontal>

</template>
