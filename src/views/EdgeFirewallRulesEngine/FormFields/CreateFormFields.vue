<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldSwitch from '@/templates/form-fields-inputs/fieldSwitch'

  defineOptions({
    name: 'edge-firewall-rules-engine-create-form-fields'
  })
</script>
<template>
  <FormHorizontal
    title="General"
    description="Create a rule set to handle the conditional execution of behaviors through logical operators."
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          name="name"
          :value="name"
          description="Give a unique and descriptive name to identify the rule."
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Description"
          name="description"
          :value="description"
          description="Add a short text that describes the rule to remember what it's used for or write another type of comment."
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Criteria"
    description="Set the conditions to execute the rule. Select a variable from the list, the operator and, if prompted, enter the comparison string."
    :isDrawer="true"
  >
    <template #inputs> </template>
  </FormHorizontal>
  <FormHorizontal
    title="Behaviors"
    description="Set the behaviors you want your rule to perform if the conditions defined in the criteria are met. Select a behavior and all required information. Some actions can't be used together or in some conditions."
    :isDrawer="true"
  >
    <template #inputs> </template
  ></FormHorizontal>

  <FormHorizontal
    title="Status"
    :isDrawer="true"
  >
    <template #inputs>
      <div class="flex w-full gap-3 items-start">
        <FieldSwitch
          name="active"
          label="Active"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
