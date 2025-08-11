<script setup>
  import CreateFormBlock from '@/templates/create-form-block'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import FormFieldsEdgeStorage from './FormFields/FormFieldsEdgeStorage.vue'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import * as yup from 'yup'
  import { computed, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { useToast } from 'primevue/usetoast'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import DrawerCredential from './Drawer'
  import PrimeButton from 'primevue/button'
  import { useDialog } from 'primevue/usedialog'
  import CredentialCreatedDialog from './Dialog/CredentialCreatedDialog.vue'
  import { edgeStorageService } from '@/services/v2'

  defineOptions({
    name: 'edge-storage-view'
  })
  const route = useRoute()
  const toast = useToast()
  const { findBucketById, selectedBucket, createdBucket, removeCredential } = useEdgeStorage()
  const { openDeleteDialog } = useDeleteDialog()
  const dialog = useDialog()
  const router = useRouter()
  const drawerCredentialRef = ref()
  const listCredentialsRef = ref()

  const activeTab = ref(0)

  const credentialsColumns = [
    {
      field: 'name',
      header: 'Name'
    },
    {
      field: 'accessKey',
      header: 'Access Key'
    },
    {
      field: 'secretKey',
      header: 'Secret Key'
    },
    {
      field: 'capacities',
      header: 'Capacities'
    },
    {
      field: 'createdAt',
      header: 'Create Data'
    },
    {
      field: 'expiresAt',
      header: 'Expiration Date'
    }
  ]

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

  const getCredentials = () => {
    return { body: selectedBucket.value.credentials }
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

  const openCreateCredentialDrawer = () => {
    drawerCredentialRef.value.openDrawerCreate()
  }

  const showCredentialModal = (credential) => {
    if (credential) {
      dialog.open(CredentialCreatedDialog, {
        data: {
          credential,
          clipboardWrite: navigator.clipboard.writeText.bind(navigator.clipboard)
        },
        props: {
          header: 'Credential has been created',
          modal: true,
          closable: true,
          credential,
          clipboardWrite: navigator.clipboard.writeText.bind(navigator.clipboard)
        }
      })
    }
    listCredentialsRef.value?.reload()
  }
</script>

<template>
  <DrawerCredential
    ref="drawerCredentialRef"
    @onSuccess="showCredentialModal"
  />
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock :pageTitle="title" />
    </template>
    <template #content>
      <template v-if="isCreatePage">
        <component
          @on-edit-success="handleResponse"
          @on-response="handleResponse"
          :is="componentForm.component"
          v-bind="componentForm.props"
        >
          <template #form>
            <FormFieldsEdgeStorage
              :show-danger-zone="!isCreatePage"
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
      <TabView
        v-else
        v-model:activeIndex="activeTab"
        class="bucket-settings-tabs"
      >
        <TabPanel header="Main Settings">
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
        </TabPanel>
        <TabPanel header="Credentials">
          <ListTableBlock
            ref="listCredentialsRef"
            :columns="credentialsColumns"
            :listService="getCredentials"
            addButtonLabel="Credential"
            emptyListMessage="No credentials found."
            :enableEditClick="false"
            :actions="[
              {
                type: 'delete',
                title: 'credential',
                icon: 'pi pi-trash',
                service: removeCredential
              }
            ]"
            :isTabs="true"
            class="py-4"
          >
            <template #addButton>
              <PrimeButton
                icon="pi pi-plus"
                data-testid="functions-instance__create-button"
                label="Credential"
                @click="openCreateCredentialDrawer"
              />
            </template>
          </ListTableBlock>
        </TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
