<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsKnowledgeBase from './FormFields/FormFieldsKnowledgeBase.vue'
  import { computed, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import { knowledgeBaseService } from '@/services/v2/knowledge-base/knowledge-base-service'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import * as yup from 'yup'

  defineOptions({
    name: 'knowledge-base-view'
  })

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const props = defineProps({
    mode: {
      type: String,
      default: 'create'
    }
  })

  const route = useRoute()
  const isCreatePage = computed(() => route.name === 'create-knowledge-base')
  const title = computed(() =>
    isCreatePage.value ? 'Create Knowledge Base' : 'Edit Knowledge Base'
  )

  const validationSchema = yup.object({
    name: yup
      .string()
      .required('Name is required')
      .min(6, 'Name must be at least 6 characters')
      .max(50, 'Name must be at most 50 characters')
      .matches(/^[a-zA-Z0-9-]+$/, 'Use only letters, numbers and hyphen (-)'),
    description: yup.string().required('Description is required'),
    embedding_model: yup.string()
  })

  const loadKnowledgeBaseService = ({ id }) => knowledgeBaseService.loadKnowledgeBase(id)
  const editKnowledgeBaseService = ({ id, ...payload }) =>
    knowledgeBaseService.updateKnowledgeBase(id, payload)

  const componentForm = computed(() => {
    return {
      create: {
        component: CreateFormBlock,
        props: {
          createService: knowledgeBaseService.createKnowledgeBase,
          schema: validationSchema,
          initialValues: { embedding_model: 'text-embedding-3-small' },
          disableToast: true
        }
      },
      edit: {
        component: EditFormBlock,
        props: {
          editService: editKnowledgeBaseService,
          loadService: loadKnowledgeBaseService,
          schema: validationSchema,
          updatedRedirect: 'knowledge-base-list',
          initialValues: { embedding_model: 'text-embedding-3-small' }
        }
      }
    }[props.mode]
  })

  const handleCreateResponse = (response) => {
    tracker.product.productCreated({
      productName: 'Knowledge Base'
    })

    const toast = {
      feedback: 'Your knowledge base item has been created',
      actions: {
        link: {
          label: 'View Knowledge Base List',
          callback: () => response.redirectToUrl('/ai/knowledge-base')
        }
      }
    }
    response.showToastWithActions(toast)
  }

  const handleEditSuccess = () => {
    tracker.product.productEdited({
      productName: 'Knowledge Base'
    })
  }

  const handleCreateFail = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Knowledge Base',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleEditFail = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Knowledge Base',
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
      <PageHeadingBlock :pageTitle="title" />
    </template>
    <template #content>
      <component
        :is="componentForm.component"
        v-bind="componentForm.props"
        @on-response="handleCreateResponse"
        @on-response-fail="handleCreateFail"
        @on-edit-success="handleEditSuccess"
        @on-edit-fail="handleEditFail"
      >
        <template #form>
          <FormFieldsKnowledgeBase :isEditMode="!isCreatePage" />
        </template>
        <template #action-bar="{ onSubmit, onCancel, loading }">
          <ActionBarTemplate
            @onSubmit="onSubmit"
            @onCancel="onCancel"
            :loading="loading"
          />
        </template>
      </component>
    </template>
  </ContentBlock>
</template>
