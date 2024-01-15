<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="WAF Rules"> </PageHeadingBlock>
    </template>
    <template #content>
      <TabView
        v-model:activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full"
      >
        <TabPanel header="Main Settings">
          <EditFormBlock
            :editService="submitEditWafRules"
            :loadService="props.loadWafRulesService"
            :schema="validationSchema"
            :isTabs="true"
            :disableRedirect="true"
          >
            <template #form>
              <FormFieldsWafRules :disabledActive="false"></FormFieldsWafRules>
            </template>
            <template #action-bar="{ onSubmit, formValid, onCancel, loading }">
              <ActionBarTemplate
                v-if="showEditFormWithActionTab"
                @onSubmit="onSubmit"
                @onCancel="onCancel"
                :loading="loading"
                :submitDisabled="!formValid"
              />
            </template>
          </EditFormBlock>
        </TabPanel>
        <TabPanel header="Tuning">
          <h1>Tuning</h1>
        </TabPanel>
        <TabPanel header="Allowed Rules">
          <ListTableNoHeaderBlock
            ref="listAllowedRef"
            v-if="hasContentToList"
            pageTitleDelete="Waf Rules Allowed"
            addButtonLabel="Allowed Rule"
            :editInDrawer="openEditDrawerWafRulesAllowed"
            :columns="wafRulesAllowedColumns"
            :listService="handleListWafRulesAllowedService"
            :deleteService="handleDeleteWafRulesAllowedService"
            @on-load-data="handleLoadData"
            emptyListMessage="No Waf Rules Allowed found."
          >
            <template #addButton>
              <PrimeButton
                icon="pi pi-plus"
                label="Allowed Rule"
                @click="openCreateDrawerIDNSResource"
              />
            </template>
          </ListTableNoHeaderBlock>

          <EmptyResultsBlock
            v-else
            title="No Waf Rules Allowed has been created"
            description=" Click the button below to initiate the setup process and create your first waf rules allowed."
            createButtonLabel="Allowed Rule"
            :documentationService="documentationService"
            :inTabs="true"
          >
            <template #default>
              <PrimeButton
                severity="secondary"
                icon="pi pi-plus"
                label="Add"
                @click="openCreateDrawerIDNSResource"
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
            @onSuccess="reloadWafRulesAllowedList"
            title="Create New"
          >
            <template #formFields>
              <FormFieldsAllowed></FormFieldsAllowed>
            </template>
          </CreateDrawerBlock>

          <EditDrawerBlock
            v-if="showEditWafRulesAllowedDrawer"
            :id="selectedWafRulesAllowedToEdit"
            v-model:visible="showEditWafRulesAllowedDrawer"
            :loadService="handleLoadWafRulesAllowedService"
            :editService="handleEditWafRulesAllowedService"
            :schema="validationSchemaAllowed"
            @onSuccess="reloadWafRulesAllowedList"
            title="Edit Waf Rules Allowed"
          >
            <template #formFields>
              <FormFieldsAllowed />
            </template>
          </EditDrawerBlock>
        </TabPanel>
      </TabView>
      <router-view></router-view>
    </template>
  </ContentBlock>
</template>
<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import CreateDrawerBlock from '@templates/create-drawer-block'
  import EditDrawerBlock from '@templates/edit-drawer-block'
  import EditFormBlock from '@templates/edit-form-block'
  import ListTableNoHeaderBlock from '@templates/list-table-block/no-header'
  import PageHeadingBlock from '@templates/page-heading-block'
  import PrimeButton from 'primevue/button'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { computed, onBeforeMount, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'
  import FormFieldsWafRules from './FormFields/FormFieldsWafRules.vue'
  import FormFieldsAllowed from './FormFields/FormFieldsAllowed.vue'

  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)
  const hasContentToList = ref(true)
  const selectedWafRulesAllowedToEdit = ref(0)
  const showEditWafRulesAllowedDrawer = ref(false)
  const showCreateWafRulesAllowedDrawer = ref(false)
  const listAllowedRef = ref('')

  const props = defineProps({
    editWafRulesService: {
      type: Function,
      required: true
    },
    loadWafRulesService: {
      type: Function,
      required: true
    },
    listWafRulesAllowedService: {
      type: Function,
      required: true
    },
    deleteWafRulesAllowedService: {
      type: Function,
      required: true
    },
    createWafRulesAllowedService: {
      type: Function,
      required: true
    },
    loadWafRulesAllowedService: {
      type: Function,
      required: true
    },
    editWafRulesAllowedService: {
      type: Function,
      required: true
    }
  })

  const validationSchemaAllowed = yup.object({
    matchZones: yup.array(),
    path: yup.string().required(),
    reason: yup.string().required(),
    ruleId: yup.string().required(),
    status: yup.boolean(),
    useRegex: yup.boolean()
  })

  const initialValues = {
    matchZones: [{ matches_on: 'value', zone: 'path', zone_input: null }],
    path: '',
    reason: '',
    ruleId: 0,
    status: false,
    useRegex: false
  }

  const validationSchema = yup.object({
    name: yup.string().required(),
    crossSiteScriptingSensitivity: yup.string(),
    directoryTraversalSensitivity: yup.string(),
    evadingTricksSensitivity: yup.string(),
    fileUploadSensitivity: yup.string(),
    identifiedAttackSensitivity: yup.string(),
    remoteFileInclusionSensitivity: yup.string(),
    sqlInjectionSensitivity: yup.string(),
    unwantedAccessSensitivity: yup.string(),
    active: yup.boolean(),
    fileUpload: yup.boolean(),
    evadingTricks: yup.boolean(),
    unwantedAccess: yup.boolean(),
    identifiedAttack: yup.boolean(),
    crossSiteScripting: yup.boolean(),
    directoryTraversal: yup.boolean(),
    remoteFileInclusion: yup.boolean(),
    sqlInjection: yup.boolean()
  })

  const wafRuleId = ref(route.params.id)

  const renderTabByRouterPath = () => {
    if (route.name === 'edit-waf-rules') {
      activeTab.value = 0
    }
    if (route.name === 'edit-waf-rules-tuning') {
      activeTab.value = 1
    }
    if (route.name === 'edit-waf-rules-allowed') {
      activeTab.value = 2
    }
  }

  const changeRouteByClickingOnTab = (e) => {
    if (e.index === 0) {
      router.push({ name: 'edit-waf-rules', params: { id: wafRuleId.value } })
    }
    if (e.index === 1) {
      router.push({ name: 'edit-waf-rules-tuning', params: { id: wafRuleId.value } })
    }
    if (e.index === 2) {
      router.push({
        name: 'edit-waf-rules-allowed',
        params: { id: wafRuleId.value }
      })
    }
  }

  const wafRulesAllowedColumns = ref([
    {
      field: 'ruleId',
      header: 'Rule ID'
    },
    {
      field: 'reason',
      header: 'Description'
    },
    {
      field: 'path',
      header: 'URI'
    },
    {
      field: 'matchZones',
      header: 'Match Zone Set',
      type: 'component',
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

  const showEditFormWithActionTab = computed(() => {
    return activeTab.value === 0
  })

  const submitEditWafRules = async (payload) => {
    return await props.editWafRulesService(payload, parseInt(wafRuleId.value))
  }

  const handleListWafRulesAllowedService = async (payload) => {
    return await props.listWafRulesAllowedService({ payload, id: wafRuleId.value })
  }

  const handleDeleteWafRulesAllowedService = async (id) => {
    return await props.deleteWafRulesAllowedService({
      wafId: wafRuleId.value,
      allowedId: id
    })
  }

  const handleCreateWafRulesAllowedService = async (payload) => {
    return await props.createWafRulesAllowedService({ payload, id: wafRuleId.value })
  }

  const handleLoadWafRulesAllowedService = async (allowedId) => {
    return await props.loadWafRulesAllowedService({ id: wafRuleId.value, allowedId })
  }

  const handleEditWafRulesAllowedService = async (payload) => {
    return await props.editWafRulesAllowedService({
      payload,
      id: wafRuleId.value,
      allowedId: selectedWafRulesAllowedToEdit.value
    })
  }

  const openEditDrawerWafRulesAllowed = (event) => {
    selectedWafRulesAllowedToEdit.value = event.id
    showEditWafRulesAllowedDrawer.value = true
  }

  const openCreateDrawerIDNSResource = () => {
    showCreateWafRulesAllowedDrawer.value = true
  }

  watch(route, () => {
    renderTabByRouterPath()
  })

  onBeforeMount(() => {
    wafRuleId.value = route.params.id
    renderTabByRouterPath()
  })
</script>
