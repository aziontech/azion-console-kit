<script setup>
  import { ref, inject } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import GoBack from '@/templates/action-bar-block/go-back'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsPersonalToken from '@/views/PersonalTokens/FormFields/FormFieldsPersonalToken'
  import DialogCopyKey from '@/templates/dialog-copy-key'
  import { useDialog } from '@aziontech/webkit/use-dialog'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import * as yup from 'yup'
  import { useRouter } from 'vue-router'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import { personalTokenService } from '@/services/v2/personal-token/personal-token-service'

  defineOptions({ name: 'create-personal-token' })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    convertDateToLocalTimezone: {
      type: Function,
      required: true
    }
  })

  const personalTokenKey = ref('')

  const validationSchema = yup.object({
    name: yup.string().required().max(100),
    description: yup.string().max(255),
    selectedExpiration: yup.string(),
    expiresAt: yup.string().required(),
    customExpiration: yup.string().when('selectedExpiration', {
      is: 'custom',
      then: (schema) => schema.required('Expiration date is required field'),
      otherwise: (schema) => schema.nullable()
    })
  })

  const store = useAccountStore()
  const { account } = storeToRefs(store)

  const getTomorrowInUserTimezone = () => {
    const today = new Date()
    const tomorrowDateValue = today.getDate() + 1
    today.setDate(tomorrowDateValue)
    const tomorrow = new Date(today)
    const userUtcOffset = account.value.utc_offset

    return props.convertDateToLocalTimezone(tomorrow, userUtcOffset)
  }

  const initialValues = {
    name: '',
    customExpiration: null,
    description: '',
    selectedExpiration: '1',
    expiresAt: getTomorrowInUserTimezone()
  }

  const router = useRouter()
  const dialog = useDialog()

  const handleResponse = ({ token }) => {
    tracker.product.productCreated({
      productName: 'Personal Token'
    })
    personalTokenKey.value = token
    dialog.open(DialogCopyKey, {
      data: {
        personalToken: personalTokenKey.value
      },
      onClose: () => {
        router.push({ name: 'list-personal-tokens' })
      }
    })
  }

  const handleFailedResponse = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Personal Token',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock
        pageTitle="Create Personal Token"
        description="Create a personal token to securely access your account via API."
      ></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="personalTokenService.createPersonalTokenService"
        @on-response="handleResponse"
        @on-response-fail="handleFailedResponse"
        :initialValues="initialValues"
        :schema="validationSchema"
        :disabledCallback="true"
        disableAfterCreateToastFeedback
      >
        <template #form>
          <FormFieldsPersonalToken
            :personalTokenKey="personalTokenKey"
            :userUtcOffset="account?.utc_offset"
            :convertDateToLocalTimezone="convertDateToLocalTimezone"
          />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <teleport
            to="#action-bar"
            v-if="!!personalTokenKey"
          >
            <GoBack />
          </teleport>
          <ActionBarTemplate
            v-else
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>
