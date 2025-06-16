<template>
  <block-custom-page />
  <block-status-code />
  <block-status-configuration />
  <block-response-details />
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
  import blockCustomPage from '@/views/CustomPages/Blocks/customPage'
  import blockStatusCode from '@/views/CustomPages/Blocks/statusCode'
  import blockStatusConfiguration from '@/views/CustomPages/Blocks/statusConfiguration'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import blockResponseDetails from '@/views/CustomPages/Blocks/responseDetails'
</script>
