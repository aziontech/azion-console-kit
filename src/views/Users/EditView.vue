<script setup>
  import * as yup from 'yup'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsUsers from './FormsFields/FormFieldsUsers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import { useToast } from 'primevue/usetoast'
  import { ref, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { useBreadcrumbs } from '@/stores/breadcrumbs'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const route = useRoute()
  const breadcrumbs = useBreadcrumbs()
  const userName = ref('Edit User')

  const setUserName = (user) => {
    const firstName = user.first_name ?? user.firstName ?? ''
    const lastName = user.last_name ?? user.lastName ?? ''
    let name = `${firstName} ${lastName}`.trim()

    if (!name) {
      name = user.name ?? user.email ?? 'User'
    }

    userName.value = name
    breadcrumbs.update(route.meta.breadCrumbs ?? [], route, name)
  }

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

  const handleTrackFailedEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'User',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

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

  const loadUser = async () => {
    const id = route.params.id
    const userData = await props.loadAnotherUserService({ id })

    currentEmail.value = userData.email

    return userData
  }

  const handleResponse = () => {
    tracker.product.productEdited({
      productName: 'User'
    })
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        :pageTitle="userName"
        data-testid="users__edit-view__page-heading"
        description="Configure user identity, access scope, and authentication settings."
      />
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editAnotherUserService"
        :loadService="loadUser"
        @on-edit-success="handleResponse"
        @loaded-service-object="setUserName"
        :updatedRedirect="props.updatedRedirect"
        :schema="validationSchema"
        @on-edit-fail="handleTrackFailedEdit"
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
