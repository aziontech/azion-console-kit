<script setup>
  import FormFieldsErrorResponses from '@/views/EdgeApplicationsErrorResponses/FormFields/FormFieldsErrorResponses'
  import EditFormBlock from '@/templates/edit-form-block'
  import * as yup from 'yup'

  const props = defineProps({
    edgeApplicationId: {
      type: String,
      required: true
    },
    listOriginsService: {
      type: Function,
      required: true
    },
    editErrorResponsesService: {
      type: Function,
      required: true
    },
    loadErrorResponsesService: {
      type: Function,
      required: true
    }
  })

  const editService = async (payload) => {
    return await props.editErrorResponsesService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  
  const loadService = async (payload) => {
    return await props.loadErrorResponsesService({
      ...payload,
      edgeApplicationId: props.edgeApplicationId
    })
  }

  const validationSchema = yup.object({
    originId: yup.string().required(),
    addresses: yup.array().of(
      yup.object().shape({
        code: yup.string().required().label('Code'),
        timeout: yup.number().required().label('Time Out'),
        uri: yup.string().required().label('Uri'),
        customStatusCode: yup.string().required().label('Custom Status Code'),
      })
    ),
  })
</script>

<template>

    <EditFormBlock
      :editService="editService"
      :loadService="loadService"
      :schema="validationSchema"
    > 
      <template #form>
        <FormFieldsErrorResponses
          :edgeApplicationId="edgeApplicationId"
          :listOriginsService="props.listOriginsService"
        />
      </template>
    </EditFormBlock>
</template>