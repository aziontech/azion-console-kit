<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Team"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createTeamPermissionsService"
        :cleanFormCallback="resetForm"
        :schema="validationSchema"
        :initialValues="initialValues"
      >
        <template #form>
          <FormFieldsTeamPermissions
            :listPermissionService="props.listPermissionService"
          ></FormFieldsTeamPermissions>
        </template>
        <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
            :submitDisabled="!formValid"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import FormFieldsTeamPermissions from './FormFields/FormFieldsTeamPermissions.vue'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'

  import * as yup from 'yup'

  const props = defineProps({
    createTeamPermissionsService: {
      type: Function,
      required: true
    },
    listPermissionService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    permissions: yup.array().required('Permission is a required field').min(1),
    isActive: yup.boolean()
  })

  const initialValues = {
    name: '',
    permissions: [],
    isActive: true
  }
</script>
