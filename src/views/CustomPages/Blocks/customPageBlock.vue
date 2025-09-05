<template>
  <FormHorizontal
    :isDrawer="props.isDrawer"
    title="Custom Page"
    description="Create custom pages to handle errors and cache TTL based on the HTTP status code received from the Connectors."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          placeholder="My custom page"
          data-testid="custom-page-form__name"
          required
          description="Give a unique and descriptive name to identify the custom page."
          name="name"
          :value="name"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import { useField } from 'vee-validate'

  const { value: name } = useField('name')

  const props = defineProps({
    isDrawer: {
      type: Boolean,
      default: false
    }
  })
</script>
