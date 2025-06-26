<template>
  <block-custom-page-block />
  <block-status-code-block />
  <form-horizontal title="Status">
    <template #inputs>
      <FieldSwitchBlock
        data-testid="edit-domains-form__active-field"
        nameField="active"
        name="active"
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
  import blockStatusCodeBlock from '@/views/CustomPages/Blocks/statusCodeBlock'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
</script>
