<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Digital Certificates"></PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="listService"
        :columns="getColumns"
        editPagePath="digital-certificates/edit"
        addButtonLabel="Digital Certificate"
        createPagePath="digital-certificates/create"
        :apiFields="DIGITAL_CERTIFICATE_API_FIELDS"
        @on-load-data="handleLoadData"
        emptyListMessage="No digital certificates found."
        :actions="actions"
        @on-before-go-to-add-page="handleTrackEventGoToCreate"
        @on-before-go-to-edit="handleTrackEventGoToEdit"
        ref="listTableBlock"
        :defaultOrderingFieldName="'-last_modified'"
        :hiddenByDefault="hiddenColumns"
      >
        <template #select-buttons>
          <div class="flex flex-row gap-2">
            <SelectButton
              v-model="digitalCertificateTypeSelected"
              :options="optionsSelectButton"
              aria-labelledby="basic"
              class="h-9 p-1"
            />
          </div>
        </template>
        <template #addButton>
          <CreateMenuBlock
            addButtonLabel="Digital Certificate"
            :items="items"
          />
        </template>
      </FetchListTableBlock>

      <EmptyResultsBlock
        v-else
        title="No digital certificate has been added"
        description="Click the button below to add your first digital certificate."
        :documentationService="documentationCatalog.digitalCertificates"
      >
        <template #default>
          <CreateMenuBlock
            addButtonLabel="Digital Certificate"
            :items="items"
            severity="secondary"
          />
        </template>
        <template #illustration>
          <Illustration />
        </template>
      </EmptyResultsBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import { ref, computed, inject, watch } from 'vue'
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { documentationCatalog } from '@/helpers'
  import SelectButton from 'primevue/selectbutton'
  import { useDigitalCertificate } from './FormFields/composables/certificate'
  import CreateMenuBlock from './CreateMenuBlock.vue'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const listTableBlock = ref(null)

  defineOptions({ name: 'digital-certificates-view' })

  const {
    certificateTypeList,
    certificateType,
    CERTIFICATE_TYPES,
    handleClickToCreate,
    listService,
    deleteService,
    firstLoadData,
    setFirstLoadData
  } = useDigitalCertificate()

  const hasContentToList = ref(true)
  const DIGITAL_CERTIFICATE_API_FIELDS = [
    'id',
    'name',
    'subject_name',
    'issuer',
    'status',
    'status_detail',
    'validity',
    'type',
    'challenge',
    'authority',
    'key_algorithm',
    'last_editor',
    'last_modified',
    'managed'
  ]
  const digitalCertificateTypeSelected = ref('Certificates')
  const optionsSelectButton = ref(['Certificates', 'CRL'])

  const items = [
    {
      label: 'Create a Server Certificate',
      icon: 'pi pi-plus',
      command: () => {
        handleClickToCreate(CERTIFICATE_TYPES.EDGE_CERTIFICATE)
      }
    },
    {
      label: 'Import a Trusted Certificate',
      icon: 'pi pi-plus',
      command: () => {
        handleClickToCreate(CERTIFICATE_TYPES.TRUSTED)
      }
    },
    {
      label: 'Import a CRL',
      icon: 'pi pi-plus',
      command: () => {
        handleClickToCreate(CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST)
      }
    }
  ]

  const actions = computed(() => [
    {
      type: 'delete',
      title: certificateTypeList.value === 'CRL' ? 'CRL' : 'digital certificate',
      icon: 'pi pi-trash',
      service: deleteService.value
    }
  ])

  const handleLoadData = (event) => {
    if (firstLoadData.value) {
      hasContentToList.value = event
    }
    setFirstLoadData(false)
  }

  const handleTrackEventGoToCreate = () => {
    tracker.product.clickToCreate({
      productName: 'Digital Certificate'
    })
  }

  const handleTrackEventGoToEdit = () => {
    tracker.product.clickToEdit({
      productName: 'Digital Certificate'
    })
  }

  const hiddenColumns = computed(() => {
    if (certificateTypeList.value === 'CRL') {
      return []
    }
    return ['managed', 'challenge', 'authority', 'keyAlgorithm']
  })

  const getColumns = computed(() => {
    if (certificateTypeList.value === 'CRL') {
      return [
        {
          field: 'id',
          header: 'ID',
          sortField: 'id',
          filterPath: 'id'
        },
        {
          field: 'name',
          header: 'Name',
          type: 'component',
          sortField: 'name',
          component: (columnData) =>
            columnBuilder({ data: { value: columnData }, columnAppearance: 'expand-text-column' })
        },
        {
          field: 'issuer',
          header: 'Issuer',
          sortField: 'issuer'
        },
        {
          field: 'lastEditor',
          header: 'Last Editor',
          sortField: 'last_editor',
          type: 'component',
          component: (columnData) =>
            columnBuilder({ data: { value: columnData }, columnAppearance: 'expand-text-column' })
        },
        {
          field: 'lastModified',
          header: 'Last Modified',
          sortField: 'last_modified',
          type: 'component',
          component: (columnData) =>
            columnBuilder({ data: { value: columnData }, columnAppearance: 'expand-text-column' })
        },
        {
          field: 'status',
          header: 'Status',
          sortField: 'status',
          type: 'component',
          component: (columnData) =>
            columnBuilder({
              data: { ...columnData.status, tooltipText: columnData.statusDetail },
              columnAppearance: 'tag-with-tooltip'
            })
        }
      ]
    }
    return [
      {
        field: 'id',
        header: 'ID',
        sortField: 'id',
        filterPath: 'id'
      },
      {
        field: 'name',
        header: 'Name',
        type: 'component',
        sortField: 'name',
        component: (columnData) =>
          columnBuilder({ data: { value: columnData }, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'subjectName',
        header: 'Subject Names',
        sortField: 'subject_name',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
      },
      {
        field: 'issuer',
        header: 'Issuer',
        sortField: 'issuer'
      },
      {
        field: 'type',
        header: 'Type',
        sortField: 'type'
      },
      {
        field: 'validity',
        header: 'Expiration Date',
        sortField: 'validity',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: { value: columnData }, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'lastEditor',
        header: 'Last Editor',
        sortField: 'last_editor',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: { value: columnData }, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'lastModified',
        header: 'Last Modified',
        sortField: 'last_modified',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: { value: columnData }, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'status',
        header: 'Status',
        sortField: 'status',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: { ...columnData.status, tooltipText: columnData.statusDetail },
            columnAppearance: 'tag-with-tooltip'
          })
      },
      {
        field: 'managed',
        header: 'Managed',
        sortField: 'managed',
        type: 'component',
        component: (columnData) =>
          columnBuilder({
            data: { content: columnData, severity: columnData ? 'success' : 'danger' },
            columnAppearance: 'tag'
          })
      },
      {
        field: 'challenge',
        header: 'Challenge',
        sortField: 'challenge'
      },
      {
        field: 'authority',
        header: 'Authority',
        sortField: 'authority'
      },
      {
        field: 'keyAlgorithm',
        header: 'Key Algorithm',
        sortField: 'key_algorithm'
      }
    ]
  })

  const changeListServiceByCertificateType = () => {
    listTableBlock.value?.reload({}, listService.value)
  }

  watch(
    () => certificateTypeList.value,
    (value) => {
      changeListServiceByCertificateType(value)
    },
    {
      immediate: true
    }
  )

  watch(
    () => digitalCertificateTypeSelected.value,
    (value) => {
      switch (value) {
        case 'Certificates':
          certificateTypeList.value = 'Certificates'
          break
        case 'CRL':
          certificateTypeList.value = 'CRL'
          break
      }
    }
  )

  watch(
    () => certificateType.value,
    (value) => {
      switch (value) {
        case CERTIFICATE_TYPES.EDGE_CERTIFICATE:
          digitalCertificateTypeSelected.value = 'Certificates'
          break
        case CERTIFICATE_TYPES.TRUSTED:
          digitalCertificateTypeSelected.value = 'Certificates'
          break
        case CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST:
          digitalCertificateTypeSelected.value = 'CRL'
          break
      }
    },
    {
      immediate: true
    }
  )
</script>
