<template>
  <block-custom-page-block />
  <block-pages-code-block />
  <form-horizontal title="Status">
    <template #inputs>
      <FieldSwitchBlock
        data-testid="edit-domains-form__active-field"
        nameField="active"
        name="active"
        :value="active"
        auto
        :isCard="false"
        title="Active"
      />
    </template>
  </form-horizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import blockCustomPageBlock from '@/views/CustomPages/Blocks/customPageBlock'
  import blockPagesCodeBlock from '@/views/CustomPages/Blocks/pagesCodeBlock'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { useField } from 'vee-validate'

  const { value: active } = useField('active')
</script>
