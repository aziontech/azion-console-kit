<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import PrimeButton from 'primevue/button'
  import Divider from 'primevue/divider'

  import { useField } from 'vee-validate'
  // import { useToast } from 'primevue/usetoast'

  const { value: preset } = useField('preset')
  const { value: edgeApplicationName } = useField('edgeApplicationName')
  const { value: rootDirectory } = useField('rootDirectory')
  const { value: mode } = useField('mode')
  const { value: installCommand } = useField('installCommand')
  const { value: newVariables } = useField('newVariables')

  const addVariable = () => {
    if (!Array.isArray(newVariables.value)) {
      newVariables.value = []
    }
    newVariables.value.push({
      key: '',
      value: ''
    })
  }

  const removeVariable = (index) => {
    newVariables.value.splice(index, 1)
  }
</script>

<template>
  <FormHorizontal
    title="GitHub Connection"
    description="Provide access to GitHub to import an existing project."
  >
    <template #inputs>
      <!-- <InputText /> -->
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="General"
    description="Define the main settings for the project to be deployed on Azion's edge."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Edge Application Name *"
          name="edgeApplicationName"
          :value="edgeApplicationName"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldDropdown
          :options="[
            { label: 'Public', value: 'public' },
            { label: 'Private', value: 'private' }
          ]"
          optionLabel="label"
          optionValue="value"
          label="Preset *"
          name="preset"
          :value="preset"
        />
      </div>

      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Root Directory *"
          name="rootDirectory"
          placeholder="./"
          :value="rootDirectory"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Mode *"
          name="mode"
          placeholder=".next"
          :value="mode"
        />
      </div>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Install Command *"
          name="installCommand"
          placeholder="npm install"
          :value="installCommand"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Variables"
    description="Add project variables as needed. Use them as global variables and edit or turn them into secrets on the Variables page."
  >
    <template #inputs>
      <template v-if="newVariables?.length">
        <div
          v-for="(variable, index) in newVariables"
          class="flex flex-col gap-5"
          :key="index"
        >
          <div class="flex items-center gap-3">
            <Divider
              class="px-3 z-0"
              align="left"
              type="dashed"
            >
              New Variable
            </Divider>
            <PrimeButton
              class="h-8 max-sm:w-full position-absolute right-0 top-0"
              icon="pi pi-trash"
              outlined
              type="button"
              aria-label="Remove Origin"
              @click="removeVariable(index)"
            />
          </div>
          <div class="flex gap-4">
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                label="Key *"
                :name="`newVariables[${index}].key`"
                :value="newVariables[index].key"
              />
            </div>
            <div class="flex flex-col sm:max-w-lg w-full gap-2">
              <FieldText
                label="Value *"
                :name="`newVariables[${index}].value`"
                :value="newVariables[index].value"
              />
            </div>
          </div>
        </div>

        <Divider />
      </template>

      <div class="flex flex-col sm:flex-row gap-4">
        <PrimeButton
          icon="pi pi-plus-circle"
          outlined
          label="Variable"
          @click="addVariable"
        />
        <PrimeButton
          link
          icon-pos="right"
          icon="pi pi-external-link"
          label="View All Variables"
          @click="addVariable"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
