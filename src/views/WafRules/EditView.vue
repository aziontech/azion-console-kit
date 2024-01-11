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
          <h1>Allowed Rules</h1>
          <!-- <ListTableNoHeaderBlock
            ref="listIDNSResourcesRef"
            v-if="hasContentToList"
            pageTitleDelete="Record"
            addButtonLabel="Add"
            :editInDrawer="openEditDrawerIDNSResource"
            :columns="recordListColumns"
            :listService="listRecordsServiceIntelligentDNSDecorator"
            :deleteService="deleteRecordsServiceIntelligentDNSDecorator"
            @on-load-data="handleLoadData"
            emptyListMessage="No Record found."
          >
            <template #addButton>
              <PrimeButton
                icon="pi pi-plus"
                label="Add"
                @click="openCreateDrawerIDNSResource"
              />
            </template>
          </ListTableNoHeaderBlock>

          <EmptyResultsBlock
            v-else
            title="No record has been created"
            description=" Click the button below to initiate the setup process and create your first record."
            createButtonLabel="Add"
            createPagePath="records/create"
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
            v-if="showCreateRecordDrawer"
            v-model:visible="showCreateRecordDrawer"
            :createService="createRecordsService"
            :schema="validationSchemaIDNSRecords"
            :initialValues="initialValuesCreateRecords"
            @onSuccess="reloadResourcesList"
            title="Create Intelligent DNS Record"
          >
            <template #formFields>
              <FormFieldsRecords />
            </template>
          </CreateDrawerBlock>

          <EditDrawerBlock
            v-if="showEditRecordDrawer"
            :id="selectedIdnsRecordToEdit"
            v-model:visible="showEditRecordDrawer"
            :loadService="loadRecordServiceWithIDNSIdDecorator"
            :editService="editRecordServiceWithIDNSIdDecorator"
            :schema="validationSchemaIDNSRecords"
            @onSuccess="reloadResourcesList"
            title="Edit Intelligent DNS Record"
          >
            <template #formFields>
              <FormFieldsRecords />
            </template>
          </EditDrawerBlock> -->
        </TabPanel>
      </TabView>
      <router-view></router-view>
    </template>
  </ContentBlock>
</template>
<script setup>
  //   import Illustration from '@/assets/svg/illustration-layers.vue'
  import ActionBarTemplate from '@/templates/action-bar-block/action-bar-with-teleport'
  import ContentBlock from '@/templates/content-block'
  //   import EmptyResultsBlock from '@/templates/empty-results-block'
  //   import CreateDrawerBlock from '@templates/create-drawer-block'
  //   import EditDrawerBlock from '@templates/edit-drawer-block'
  import EditFormBlock from '@templates/edit-form-block'
  //   import ListTableNoHeaderBlock from '@templates/list-table-block/no-header'
  import PageHeadingBlock from '@templates/page-heading-block'
  //   import PrimeButton from 'primevue/button'
  import TabPanel from 'primevue/tabpanel'
  import TabView from 'primevue/tabview'
  import { computed, onBeforeMount, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import * as yup from 'yup'
  import FormFieldsWafRules from './FormFields/FormFieldsWafRules.vue'
  const route = useRoute()
  const router = useRouter()
  const activeTab = ref(0)

  const props = defineProps({
    editWafRulesService: {
      type: Function,
      required: true
    },
    loadWafRulesService: {
      type: Function,
      required: true
    }
  })

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

  //   const handleLoadData = (event) => {
  //     hasContentToList.value = event
  //   }

  const showEditFormWithActionTab = computed(() => {
    return activeTab.value === 0
  })

  const submitEditWafRules = async (payload) => {    
    return await props.editWafRulesService(payload,  parseInt(wafRuleId.value) )
  }

  watch(route, () => {
    renderTabByRouterPath()
  })

  onBeforeMount(() => {
    wafRuleId.value = route.params.id
    renderTabByRouterPath()
  })
</script>