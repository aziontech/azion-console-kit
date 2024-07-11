<script setup>
  import * as yup from 'yup'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsUsers from './FormsFields/FormFieldsUsers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { useToast } from 'primevue/usetoast'
  import { ref } from 'vue'
  import { useRoute } from 'vue-router'

  const props = defineProps({
    loadAccountDetailsService: {
      type: Function,
      required: true
    },
    createUsersService: {
      type: Function,
      required: true
    },
    listTimezonesService: {
      type: Function,
      required: true
    },
    listCountriesPhoneService: {
      type: Function,
      required: true
    },
    listTeamsService: {
      type: Function,
      required: true
    },
    editAnotherUserService: {
      type: Function,
      required: true
    },
    loadAnotherUserService: {
      type: Function,
      required: true
    }
  })

  const validationSchema = yup.object({
    firstName: yup.string().max(30).required().label('First name'),
    lastName: yup.string().max(30).required().label('Last name'),
    timezone: yup.string().required().label('Timezone'),
    language: yup.string(),
    email: yup.string().email().max(254).required().label('Email'),
    countryCallCode: yup.string().required().label('Country'),
    mobile: yup.string().max(20).required().label('Phone Number'),
    isAccountOwner: yup.boolean(),
    teamsIds: yup.array().when('isAccountOwner', {
      is: false,
      then: (schema) => schema.min(1, 'Must select at least one team')
    }),
    twoFactorEnabled: yup.boolean()
  })

  const currentEmail = ref()

  const toast = useToast()
  const formSubmit = async (onSubmit, values) => {
    await onSubmit()
    if (values.email !== currentEmail.value) {
      const toastConfig = {
        closable: true,
        severity: 'warn',
        summary: 'Email sent',
        detail: 'The user must check the inbox and follow the instructions to verify this email.'
      }
      toast.add({ ...toastConfig })
    }
  }

  const route = useRoute()
  const loadUser = async () => {
    const id = route.params.id
    const userData = await props.loadAnotherUserService({ id })

    currentEmail.value = userData.email

    return userData
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Edit User"
        data-testid="users__edit-view__page-heading"
      />
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editAnotherUserService"
        :loadService="loadUser"
        :updatedRedirect="props.updatedRedirect"
        :schema="validationSchema"
      >
        <template #form>
          <FormFieldsUsers
            :loadAccountDetailsService="loadAccountDetailsService"
            :listTimezonesService="listTimezonesService"
            :listCountriesPhoneService="listCountriesPhoneService"
            :listTeamsService="listTeamsService"
            :isEditForm="true"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading, values }">
          <ActionBarTemplate
            @onSubmit="formSubmit(onSubmit, values)"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>
