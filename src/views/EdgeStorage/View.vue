<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEdgeStorage from './FormFields/FormFieldsEdgeStorage.vue'
  import * as yup from 'yup'
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeStorageService } from '@/services/v2'

  defineOptions({
    name: 'edge-storage-view'
  })
  const route = useRoute()
  const toast = useToast()
  const { findBucketById, selectedBucket } = useEdgeStorage()

  const { openDeleteDialog } = useDeleteDialog()
  const router = useRouter()

  const props = defineProps({
    mode: {
      type: String,
      default: 'create'
    }
  })

  const isCreatePage = computed(() => route.name === 'edge-storage-create')
  const title = computed(() => (isCreatePage.value ? 'Create Bucket' : 'Edit Bucket'))
  const componentForm = computed(() => {
    return {
      create: {
        component: CreateFormBlock,
        props: {
          createService: edgeStorageService.createEdgeStorageBucket,
          schema: validationSchema,
          disableToast: true
        }
      },
      edit: {
        component: EditFormBlock,
        props: {
          editService: edgeStorageService.updateEdgeStorageBucket,
          loadService: loadService,
          schema: validationSchema,
          title: title,
          updatedRedirect: 'edge-storage-list',
          disableAfterCreateToastFeedback: true,
          disableNameEdit: true
        }
      }
    }[props.mode]
  })

  const nameRegex = /^[A-Za-z0-9_-]+$/
  const edgeAccess = ['read_write', 'read_only', 'restricted']

  const validationSchema = yup.object({
    name: yup
      .string()
      .label('Name')
      .required()
      .min(6)
      .max(63)
      .test('name', 'Invalid name format', (value) => nameRegex.test(value)),
    edge_access: yup
      .string()
      .label('Edge Access')
      .required()
      .default('read_write')
      .test('edge_access', 'Invalid edge access format', (value) => edgeAccess.includes(value))
  })

  const handleResponse = (response) => {
    createdBucket.value = response.data.name
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: `Bucket "${response.data.name}" has been ${
        isCreatePage.value ? 'created' : 'updated'
      } successfully`,
      life: 5000
    })
  }

  const loadService = ({ id }) => {
    const bucket = findBucketById(id)
    if (!bucket) {
      throw new Error('Bucket not found')
    }

    return {
      name: bucket.name,
      edge_access: bucket.edgeAccess
    }
  }

  const handleDeleteBucket = () => {
    openDeleteDialog({
      title: selectedBucket.value.name,
      data: {
        deleteConfirmationText: selectedBucket.value.name
      },
      deleteService: () => edgeStorageService.deleteEdgeStorageBucket(selectedBucket.value.name),
      successCallback: () => {
        toast.add({
          severity: 'success',
          summary: 'Success',
          detail: `Bucket "${selectedBucket.value.name}" has been deleted successfully`,
          life: 5000
        })
      },
      closeCallback: () => {
        selectedBucket.value = null
        router.push({ name: 'edge-storage-list' })
      }
    })
  }
</script>

<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="title" />
    </template>
    <template #content>
      <component
        @on-edit-success="handleResponse"
        :is="componentForm.component"
        v-bind="componentForm.props"
      >
        <template #form>
          <FormFieldsEdgeStorage
            :show-danger-zone="!isCreatePage"
            @delete-bucket="handleDeleteBucket"
            :disable-name-edit="!isCreatePage"
          />
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
