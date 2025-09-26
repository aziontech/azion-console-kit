<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEdgeStorage from './FormFields/FormFieldsEdgeStorage.vue'
  import { computed } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'

  defineOptions({
    name: 'object-storage-view'
  })
  const route = useRoute()
  const toast = useToast()
  const { findBucketById, selectedBucket, bucketTableNeedRefresh, validationSchema } =
    useEdgeStorage()

  const { openDeleteDialog } = useDeleteDialog()
  const router = useRouter()

  const props = defineProps({
    mode: {
      type: String,
      default: 'create'
    }
  })

  const isCreatePage = computed(() => route.name === 'object-storage-create')
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
          updatedRedirect: 'object-storage-list',
          disableAfterCreateToastFeedback: true,
          disableNameEdit: true
        }
      }
    }[props.mode]
  })

  const handleResponse = (response) => {
    bucketTableNeedRefresh.value = true
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
      title: 'Bucket',
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
        bucketTableNeedRefresh.value = true
        router.push({ name: 'object-storage-list' })
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
        @on-response="handleResponse"
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
