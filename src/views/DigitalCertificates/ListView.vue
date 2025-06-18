<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Digital Certificates"></PageHeadingBlock>
    </template>
    <template #content>
      <FetchListTableBlock
        v-if="hasContentToList"
        :listService="handleService()"
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
  import { digitalCertificatesService, digitalCertificatesCRLService } from '@/services/v2'
  import { documentationCatalog } from '@/helpers'
  import SelectButton from 'primevue/selectbutton'
  import { useDigitalCertificate } from './FormFields/composables/certificate'
  import CreateMenuBlock from './CreateMenuBlock.vue'
  import { useRouter } from 'vue-router'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')
  const router = useRouter()
  const listTableBlock = ref(null)

  defineOptions({ name: 'digital-certificates-view' })

  const { certificateTypeList, certificateType, CERTIFICATE_TYPES } = useDigitalCertificate()

  const hasContentToList = ref(true)
  const DIGITAL_CERTIFICATE_API_FIELDS = [
    'id',
    'name',
    'subject_name',
    'issuer',
    'status',
    'status_detail',
    'validity',
    'type'
  ]
  const digitalCertificateTypeSelected = ref('Certificates')
  const optionsSelectButton = ref(['Certificates', 'CRL'])

  const items = [
    {
      label: 'Server Certificate',
      items: [
        {
          label: 'Import Server Certificate',
          icon: 'pi pi-plus',
          command: () => {
            certificateType.value = CERTIFICATE_TYPES.EDGE_CERTIFICATE
            certificateTypeList.value = 'Certificates'
            handleCreateDigitalCertificate()
          }
        },
        {
          label: 'Generate CSR',
          icon: 'pi pi-plus',
          command: () => {
            certificateType.value = CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR
            certificateTypeList.value = 'Certificates'
            handleCreateDigitalCertificate()
          }
        }
      ]
    },
    {
      label: 'mTLS',
      items: [
        {
          label: 'Import a Trusted Certificate',
          icon: 'pi pi-plus',
          command: () => {
            certificateType.value = CERTIFICATE_TYPES.TRUSTED
            certificateTypeList.value = 'Certificates'
            handleCreateDigitalCertificate()
          }
        },
        {
          label: 'Import a CRL',
          icon: 'pi pi-plus',
          command: () => {
            certificateType.value = CERTIFICATE_TYPES.CERTIFICATE_REVOCATION_LIST
            certificateTypeList.value = 'CRL'
            handleCreateDigitalCertificate()
          }
        }
      ]
    }
  ]

  const actions = computed(() => [
    {
      type: 'delete',
      title: 'digital certificate',
      icon: 'pi pi-trash',
      service:
        certificateTypeList.value === 'CRL'
          ? digitalCertificatesCRLService.deleteDigitalCertificateCRL
          : digitalCertificatesService.deleteDigitalCertificate
    }
  ])

  const handleService = () => {
    if (certificateTypeList.value === 'CRL') {
      return digitalCertificatesCRLService.listDigitalCertificatesCRL
    } else {
      return digitalCertificatesService.listDigitalCertificates
    }
  }

  const handleCreateDigitalCertificate = () => {
    router.push('/digital-certificates/create')
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
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

  const getColumns = computed(() => {
    if (certificateTypeList.value === 'CRL') {
      return [
        {
          field: 'name',
          header: 'Name',
          type: 'component',
          sortField: 'name',
          component: (columnData) =>
            columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
        },
        {
          field: 'issuer',
          header: 'Issuer',
          sortField: 'issuer'
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
        field: 'name',
        header: 'Name',
        type: 'component',
        sortField: 'name',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
      },
      {
        field: 'subjectName',
        header: 'Subject Names',
        sortField: 'subject_name',
        type: 'component',
        component: (columnData) =>
          columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
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
        sortField: 'validity'
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
  })

  const changeListServiceByCertificateType = (value) => {
    switch (value) {
      case 'Certificates':
        listTableBlock.value?.reload({}, digitalCertificatesService.listDigitalCertificates)
        break
      case 'CRL':
        listTableBlock.value?.reload({}, digitalCertificatesCRLService.listDigitalCertificatesCRL)
        break
    }
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
        case CERTIFICATE_TYPES.EDGE_CERTIFICATE_CSR:
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
