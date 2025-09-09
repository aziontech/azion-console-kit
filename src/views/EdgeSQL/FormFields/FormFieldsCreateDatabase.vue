<template>
  <div class="flex flex-col gap-6">
    <FormHorizontal
      title="General"
      description="Set up your new SQL database with basic configuration."
      data-testid="create-database-form-general"
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Name"
            name="name"
            placeholder="my-database"
            :value="name"
            description="Give a unique and descriptive name to identify the database."
            data-testid="database-name-field"
            required
          />
        </div>
      </template>
    </FormHorizontal>
    <FormHorizontal
      title="Status"
      description=""
    >
      <template #inputs>
        <div class="flex flex-col gap-2">
          <FieldSwitchBlock
            nameField="active"
            name="active"
            auto
            :isCard="false"
            title="Active"
            subtitle=""
            data-testid="form-horizontal-active-switch"
          />
        </div>
      </template>
    </FormHorizontal>
  </div>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  import { useField } from 'vee-validate'

  defineOptions({ name: 'form-fields-create-database' })

  const { value: name } = useField('name')
</script>
