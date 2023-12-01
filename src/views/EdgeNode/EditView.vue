<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Edge Node" />
    </template>
    <template #content>
      <TabView
        :activeIndex="activeTab"
        @tab-click="changeRouteByClickingOnTab"
        class="w-full"
      >
        <TabPanel header="Main Settings">
          <div class="mt-4">
            <EditFormBlock
              :editService="pros.editEdgeNodeService"
              :loadService="pros.loadEdgeNodeService"
              :updatedRedirect="updatedRedirect"
              :initialValues="initialValues"
              :schema="validationSchema"
              backURL="/edge-node"
            >
              <template #form>
                <FormFieldsEdgeNode />
              </template>
            </EditFormBlock>
          </div>
        </TabPanel>
        <TabPanel header="Services">
          <div class="mt-4">
            <ListTableBlock
              pageTitleDelete="Service"
              addButtonLabel="Add Service"
              :listService="listServiceEdgeNode"
              :columns="servicesListColumns"
              :deleteService="deleteServiceEdgeNode"
              createPagePath="service/add"
              editPagePath="service"
            >
            </ListTableBlock>
          </div>
        </TabPanel>
        <TabPanel
          header="Routing"
          :disabled="true"
        ></TabPanel>
        <TabPanel
          header="Location"
          :disabled="true"
        ></TabPanel>
      </TabView>
    </template>
  </ContentBlock>
</template>
<script setup>
  import { ref, onMounted, onBeforeUpdate } from 'vue'
  import * as yup from 'yup'
  import { useRoute, useRouter } from 'vue-router'
  import EditFormBlock from '@/templates/edit-form-block'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ListTableBlock from '@templates/list-table-block'
  import FormFieldsEdgeNode from '@/views/EdgeNode/FormFields/FormFieldsEdgeNode.vue'

  const pros = defineProps({
    loadEdgeNodeService: { type: Function, required: true },
    editEdgeNodeService: { type: Function, required: true },
    listServiceEdgeNodeService: { type: Function, required: true },
    deleteEdgeNodeService: { type: Function, required: true },
    updatedRedirect: { type: String, required: true }
  })

  const validationSchema = yup.object({
    name: yup.string().required(),
    hashId: yup.string().required(),
    modules: yup.object(),
    addService: yup.boolean(),
    groups: yup.array(),
    addGroups: yup.array(),
    nameGroup: yup.string()
  })

  const servicesListColumns = ref([
    { field: 'name', header: 'Name' },
    { field: 'lastEditor', header: 'Last Editor' },
    { field: 'lastModified', header: 'Last Modified' },
    { field: 'status', header: 'Status' }
  ])
  const activeTab = ref(0)

  const route = useRoute()
  const router = useRouter()

  let edgeNodeId = ref(null)

  onMounted(() => {
    edgeNodeId.value = route.params.id
    renderTabCurrentRouter()
  })

  onBeforeUpdate(() => {
    renderTabCurrentRouter()
  })

  const initialValues = {
    modules: { add_services: false },
    addService: false,
    groups: [],
    addGroups: [],
    nameGroup: ''
  }

  const listServiceEdgeNode = async (payload) => {
    await pros.listServiceEdgeNodeService({ ...payload, id: route.params.id, bound: true })
  }

  const deleteServiceEdgeNode = async (serviceId) => {
    await pros.deleteEdgeNodeService({ serviceId, edgeNodeId: edgeNodeId.value })
  }

  const changeRouteByClickingOnTab = (event) => {
    if (event.index === 0) {
      router.push({ name: 'edit-edge-node', params: { id: edgeNodeId.value } })
    } else {
      router.push({ name: 'edit-edge-node-service', params: { id: edgeNodeId.value } })
    }
  }

  const renderTabCurrentRouter = () => {
    if (router.currentRoute.value.name === 'edit-edge-node-service') {
      activeTab.value = 1
    } else {
      activeTab.value = 0
    }
  }
</script>
