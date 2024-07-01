<script setup>
  import { ref } from 'vue'
  import CreateFormBlock from '@/templates/create-form-block'
  import { useToast } from 'primevue/usetoast'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import GoBack from '@/templates/action-bar-block/go-back'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FormFieldsPersonalToken from '@/views/PersonalTokens/FormFields/FormFieldsPersonalToken'
  import CopyTokenDialog from '@/views/PersonalTokens/Dialog/CopyTokenDialog'
  import { useDialog } from 'primevue/usedialog'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import * as yup from 'yup'
  import { useRouter } from 'vue-router'

  defineOptions({ name: 'create-personal-token' })

  const props = defineProps({
    createPersonalTokenService: {
      type: Function,
      required: true
    },
    clipboardWrite: {
      type: Function,
      required: true
    },
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

  const toast = useToast()
  const router = useRouter()
  const dialog = useDialog()

  const handleResponse = ({ token }) => {
    personalTokenKey.value = token
    dialog.open(CopyTokenDialog, {
      data: {
        personalToken: personalTokenKey.value,
        copy: copyPersonalToken
      },
      onClose: () => {
        router.push({ name: 'list-personal-tokens' })
      }
    })
  }

  const copyPersonalToken = async () => {
    const toastConfig = {
      closable: true,
      severity: 'success',
      summary: 'Successfully copied!'
    }

    try {
      props.clipboardWrite(personalTokenKey.value)
      toast.add({ ...toastConfig })
    } catch {
      toast.add({
        ...toastConfig,
        severity: 'error',
        detail: 'The personal token was not copied to the clipboard. Try copying it again.'
      })
    }
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Personal Token"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createPersonalTokenService"
        @on-response="handleResponse"
        :initialValues="initialValues"
        :schema="validationSchema"
        :disabledCallback="true"
        disableAfterCreateToastFeedback
      >
        <template #form>
          <FormFieldsPersonalToken
            :personalTokenKey="personalTokenKey"
            :copyPersonalToken="copyPersonalToken"
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
