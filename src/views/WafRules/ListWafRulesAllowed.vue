<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import { handleTrackerError } from '@/utils/errorHandlingTracker'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import FetchListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import PrimeButton from 'primevue/button'
  import { ref, inject } from 'vue'
  import { useRoute } from 'vue-router'
  import * as yup from 'yup'
  import FormFieldsAllowed from './FormFields/FormFieldsAllowed.vue'
  import { wafService } from '@/services/v2'
  import { optionsRuleIds, itemDefaultCondition } from '@/views/WafRules/Config'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const tracker = inject('tracker')

  const route = useRoute()
  const hasContentToList = ref(true)
  const selectedWafRulesAllowedToEdit = ref(0)
  const showEditWafRulesAllowedDrawer = ref(false)
  const showCreateWafRulesAllowedDrawer = ref(false)
  const listAllowedRef = ref('')

  const emit = defineEmits(['update:visible', 'attack-on', 'handle-go-to-tuning'])

  const props = defineProps({
    documentationServiceAllowed: {
      required: true,
      type: Function
    }
  })

  const validationSchemaAllowed = yup.object({
    ruleId: yup.string().required().label('rule id'),
    name: yup.string().required(),
    path: yup.string(),
    conditions: yup.array(),
    status: yup.boolean(),
    operator: yup.boolean()
  })

  const initialValues = {
    conditions: [itemDefaultCondition],
    path: '',
    name: '',
    ruleId: 0,
    status: true,
    operator: false
  }

  const wafRuleId = ref(route.params.id)

  const handleSuccessEdit = () => {
    reloadWafRulesAllowedList()
    tracker.product
      .productEdited({
        productName: 'Allowed Rules'
      })
      .track()
  }

  const handleSucessCreation = () => {
    reloadWafRulesAllowedList()
    tracker.product
      .productCreated({
        productName: 'Allowed Rules'
      })
      .track()
  }

  const handleFailedToCreate = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToCreate({
        productName: 'Allowed Rules',
        errorType: 'api',
        fieldName: fieldName.trim(),
        errorMessage: message
      })
      .track()
  }

  const handleFailedToEdit = (error) => {
    const { fieldName, message } = handleTrackerError(error)
    tracker.product
      .failedToEdit({
        productName: 'Allowed Rules',
        errorMessage: message,
        fieldName: fieldName,
        errorType: 'api'
      })
      .track()
  }

  const wafRulesAllowedColumns = ref([
    {
      field: 'ruleId',
      header: 'Rule ID',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
    },
    {
      field: 'name',
      header: 'Description',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-text-column' })
    },

    {
      field: 'path',
      header: 'Path'
    },
    {
      field: 'conditions',
      header: 'Conditions',
      type: 'component',
      disableSort: true,
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'expand-column' })
    },
    {
      field: 'lastModified',
      header: 'Last Modified'
    },
    {
      field: 'status',
      header: 'Status',
      type: 'component',
      sortField: 'active',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
    }
  ])

  const reloadWafRulesAllowedList = () => {
    if (hasContentToList.value) {
      listAllowedRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const handleTrackEditEvent = () => {
    tracker.product.clickToEdit({
      productName: 'Allowed Rules'
    })
  }

  const handleCreateTrackEvent = () => {
    tracker.product.clickToCreate({
      productName: 'Allowed Rules'
    })
  }

  const goToWafRulesTuning = () => {
    emit('handle-go-to-tuning', { index: 1 })
  }
  const handleListWafRulesAllowedService = async (query) => {
    return await wafService.listWafRulesAllowed({ wafId: wafRuleId.value, ...query })
  }

  const handleDeleteWafRulesAllowedService = async (id) => {
    return await wafService.deleteWafRuleAllowed({
      wafId: wafRuleId.value,
      allowedId: id
    })
  }

  const handleCreateWafRulesAllowedService = async (payload) => {
    return await wafService.createWafRuleAllowed({ payload, id: wafRuleId.value })
  }

  const handleLoadWafRulesAllowedService = async (allowedId) => {
    return await wafService.loadWafRuleAllowed({ id: wafRuleId.value, allowedId })
  }

  const handleEditWafRulesAllowedService = async (payload) => {
    return await wafService.editWafRuleAllowed({
      payload,
      wafId: wafRuleId.value,
      allowedId: selectedWafRulesAllowedToEdit.value
    })
  }

  const openEditDrawerWafRulesAllowed = (event) => {
    selectedWafRulesAllowedToEdit.value = parseInt(event.id)
    showEditWafRulesAllowedDrawer.value = true
    handleTrackEditEvent()
  }

  const openCreateDrawerWafAllowed = () => {
    tracker.product
      .clickToCreate({
        productName: 'Allowed Rule'
      })
      .track()
    showCreateWafRulesAllowedDrawer.value = true
    handleCreateTrackEvent()
  }

  const actions = [
    {
      type: 'delete',
      title: 'WAF allowed rule',
      icon: 'pi pi-trash',
      service: handleDeleteWafRulesAllowedService
    }
  ]
</script>

<template>
  <FetchListTableBlock
    ref="listAllowedRef"
    v-if="hasContentToList"
    addButtonLabel="Allowed Rule"
    :editInDrawer="openEditDrawerWafRulesAllowed"
    :columns="wafRulesAllowedColumns"
    :listService="handleListWafRulesAllowedService"
    @on-load-data="handleLoadData"
    emptyListMessage="No allowed rules found."
    isTabs
    :actions="actions"
  >
    <template #addButton>
      <PrimeButton
        icon="pi pi-plus"
        label="Allowed Rule"
        @click="openCreateDrawerWafAllowed"
        data-testid="create_Allowed Rule_button"
      />
    </template>
  </FetchListTableBlock>

  <EmptyResultsBlock
    v-else
    title="No allowed rule has been created."
    description="Click one of the buttons below to either create an allowed rule after analyzing requests with Tuning or create your first allowed rule."
    createButtonLabel="Allowed Rule"
    :documentationService="props.documentationServiceAllowed"
    :inTabs="true"
  >
    <template #default>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        label="Create from Tuning"
        @click="goToWafRulesTuning"
      >
      </PrimeButton>
      <PrimeButton
        class="max-md:w-full w-fit"
        severity="secondary"
        icon="pi pi-plus"
        label="Allowed Rule"
        @click="openCreateDrawerWafAllowed"
        data-testid="create_Allowed Rule_button"
      />
    </template>
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>

  <CreateDrawerBlock
    v-if="showCreateWafRulesAllowedDrawer"
    v-model:visible="showCreateWafRulesAllowedDrawer"
    :createService="handleCreateWafRulesAllowedService"
    :schema="validationSchemaAllowed"
    :initialValues="initialValues"
    @onError="handleFailedToCreate"
    @onSuccess="handleSucessCreation"
    title="Create Allowed Rule"
  >
    <template #formFields>
      <FormFieldsAllowed :optionsRuleIds="optionsRuleIds"></FormFieldsAllowed>
    </template>
  </CreateDrawerBlock>

  <EditDrawerBlock
    v-if="showEditWafRulesAllowedDrawer"
    :id="selectedWafRulesAllowedToEdit"
    v-model:visible="showEditWafRulesAllowedDrawer"
    :loadService="handleLoadWafRulesAllowedService"
    :editService="handleEditWafRulesAllowedService"
    :schema="validationSchemaAllowed"
    @onSuccess="handleSuccessEdit"
    @onError="handleFailedToEdit"
    title="Edit Allowed Rule"
  >
    <template #formFields>
      <FormFieldsAllowed
        :disabledRuleId="true"
        :optionsRuleIds="optionsRuleIds"
      />
    </template>
  </EditDrawerBlock>
</template>
