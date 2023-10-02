<!-- eslint-disable vue/require-prop-type-constructor -->
<!-- eslint-disable vue/valid-define-props -->
<!-- eslint-disable vue/valid-define-props -->
<template>
  <div>
    <TabView
      :activeIndex="state.activeTab"
      @tab-click="changeRouteByClickingOnTab"
    >
      <TabPanel header="Main Settings">
        <EditFormBlock
          pageTitle="Edit Edge Node"
          :editService="pros.editEdgeNodeService"
          :loadService="pros.loadEdgeNodeService"
          :initialDataSetter="setValues"
          :isValid="meta.valid"
          :formData="values"
          backURL="/edge-node"
        >
          <template #form>
            <div class="flex flex-col gap-5 mb-6">
              <h2 class="text-2xl">Main Settings</h2>
              <div>
                <InputText
                  placeholder="Name"
                  v-bind="name"
                  type="text"
                  :class="{ 'p-invalid': errors.name }"
                  v-tooltip.top="errors.name"
                  class="w-full"
                />
              </div>
              <p>
                Each node needs to run the Azion Orchestration software. It enables the
                communication between your private node and Azion Real-Time Manager, where you can
                manage your Edge Applications, Edge Functions, and many other Azion services.
              </p>
              <div class="flex flex-col gap-2">
                <InputText
                  placeholder="HashID"
                  v-bind="hashId"
                  type="text"
                  class="w-full"
                  disabled
                />
              </div>
              <div class="flex flex-col gap-2">
                <label for="groups">Node groups</label>
                <small id="groups-help"
                  >Use labels to group your Edge Nodes. Groups allow you to manage multiple Edge
                  Nodes easily in your Edge Maps for orchestration and routing.</small
                >
                <InputText
                  id="groups"
                  v-model="nameGroup"
                  aria-describedby="groups-help"
                  @keyup.enter="addNewGroup"
                />
                <div class="card flex flex-wrap gap-2">
                  <div
                    class="flex align-items-center"
                    v-for="(item, index) in groups"
                    :key="index"
                  >
                    <Checkbox
                      v-model="addGroups"
                      :name="item.name"
                      :value="item.name"
                    />
                    <label
                      for="ingredient1"
                      class="ml-2"
                    >
                      {{ item.name }}
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex flex-col gap-5">
              <h2 class="text-2xl">Orchestration Modules</h2>
              <small>Choose orchestration modules to install on your Edge Node.</small>
              <div class="flex flex-col gap-3">
                <div class="flex justify-between">
                  <label for="cells">Azion Cells</label>
                  <InputSwitch
                    id="cells"
                    disabled="true"
                  />
                </div>
                <small>
                  Azion Cells is a lightweight software framework to build and run low-latency Edge
                  Applications. By activating this option, you agree to install the framework on
                  your Edge Node.
                </small>
              </div>
              <div class="flex flex-col gap-3">
                <div class="flex justify-between">
                  <label for="health">Azion Health Check</label>
                  <InputSwitch
                    id="health"
                    disabled="true"
                  />
                </div>
                <small>
                  Azion Health Check is a service that enables your Edge Node to report the
                  availability and health constantly to Azion. By activating this option, you agree
                  to install the service on your Edge Node.
                </small>
              </div>
              <div class="flex flex-col gap-3">
                <div class="flex justify-between">
                  <label for="service">Add-On Services</label>
                  <InputSwitch
                    id="service"
                    v-model="addService"
                    :disabled="modules.value.add_services"
                  />
                </div>
                <small>
                  Enables you to instantiate add-on services from your own Services Library.
                </small>
              </div>
            </div>
          </template>
        </EditFormBlock>
      </TabPanel>
      <TabPanel
        header="Services"
        :disabled="!modules.value.add_services"
      >
        <ListTableBlock
          pageTitle="Services List"
          addButtonLabel="Add Service"
          :listService="listServiceEdgeNode"
          :columns="state.servicesListColumns"
          :deleteService="deleteServiceEdgeNode"
          createPagePath="service/add"
          editPagePath="service"
        >
        </ListTableBlock>
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
  </div>
</template>
<script setup>
  import { reactive, ref, onMounted, onBeforeUpdate } from 'vue'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useRoute, useRouter } from 'vue-router'
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import EditFormBlock from '@/templates/edit-form-block'
  import ListTableBlock from '@templates/list-table-block'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import Checkbox from 'primevue/checkbox'

  const pros = defineProps({
    loadEdgeNodeService: { type: Function, required: true },
    editEdgeNodeService: { type: Function, required: true },
    listService: { type: Function, required: true },
    deleteService: { type: Function, required: true }
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

  const state = reactive({
    servicesListColumns: [
      { field: 'name', header: 'Name' },
      { field: 'lastEditor', header: 'Last Editor' },
      { field: 'lastModified', header: 'Last Modified' },
      { field: 'status', header: 'Status' }
    ],
    activeTab: 0,
  })

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

  const { errors, defineInputBinds, meta, values, setValues } = useForm({
    validationSchema,
    initialValues: {
      modules: { add_services: false },
      addService: false,
      groups: [],
      addGroups: [],
      nameGroup: ''
    }
  })

  const name = defineInputBinds('name', { validateOnInput: true })
  const hashId = defineInputBinds('hashId', { validateOnInput: true })
  const modules = defineInputBinds('modules', { validateOnInput: true })
  const { value: addService } = useField('addService')
  const { value: groups } = useField('groups')
  const { value: addGroups } = useField('addGroups')
  const { value: nameGroup } = useField('nameGroup')

  const addNewGroup = () => {
    groups.value.push({ name: nameGroup.value })
    addGroups.value.push(nameGroup.value)
    nameGroup.value = ''
  }

  const listServiceEdgeNode = async (payload) =>
    await pros.listService({ ...payload, id: route.params.id, bound: true })

  const deleteServiceEdgeNode = async (serviceId) =>
    await pros.deleteService({ serviceId, edgeNodeId: edgeNodeId.value })

  const changeRouteByClickingOnTab = (event) => {
    if (event.index === 0) {
      router.push({ name: 'edit-edge-node', params: { id: edgeNodeId.value } })
    } else {
      router.push({ name: 'edit-edge-node-service', params: { id: edgeNodeId.value } })
    }
  }

  const renderTabCurrentRouter = () => {
    if (router.currentRoute.value.name === 'edit-edge-node-service') {
      state.activeTab = 1
    } else {
      state.activeTab = 0
    }
  }
</script>
<!-- <script >
  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import EditFormBlock from '@/templates/edit-form-block'
  import ListTableBlock from '@templates/list-table-block'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'

  import Checkbox from 'primevue/checkbox'

  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'

  export default {
    name: 'edit-edge-node',
    components: {
      TabView,
      TabPanel,
      ListTableBlock,
      EditFormBlock,
      InputText,
      InputSwitch,
      Checkbox
    },
    props: {
      loadEdgeNodeService: { type: Function, required: true },
      editEdgeNodeService: { type: Function, required: true },
      listService: { type: Function, required: true },
      deleteService: { type: Function, required: true }
    },
    data: () => {
      const validationSchema = yup.object({
        name: yup.string().required(),
        hashId: yup.string().required(),
        modules: yup.object(),
        addService: yup.boolean(),
        groups: yup.array(),
        addGroups: yup.array(),
        nameGroup: yup.string()
      })

      const { errors, defineInputBinds, meta, values, setValues } = useForm({
        validationSchema,
        initialValues: {
          modules: {
            add_services: false
          },
          addService: false,
          groups: [],
          addGroups: [],
          nameGroup: ''
        }
      })

      const name = defineInputBinds('name', { validateOnInput: true })
      const hashId = defineInputBinds('hashId', { validateOnInput: true })
      const modules = defineInputBinds('modules', { validateOnInput: true })
      const { value: addService } = useField('addService')
      const { value: groups } = useField('groups')
      const { value: addGroups } = useField('addGroups')
      const { value: nameGroup } = useField('nameGroup')
      return {
        errors,
        meta,
        values,
        name,
        hashId,
        modules,
        addService,
        addGroups,
        nameGroup,
        setValues,
        groups,
        servicesListColumns: [
          {
            field: 'name',
            header: 'Name'
          },
          {
            field: 'lastEditor',
            header: 'Last Editor'
          },
          {
            field: 'lastModified',
            header: 'Last Modified'
          },
          {
            field: 'status',
            header: 'Status'
          }
        ],
        activeTab: 0
      }
    },
    created() {
      this.edgeNodeId = this.$route.params.id
      this.renderTabCurrentRouter()
    },
    methods: {
      addNewGroup() {
        this.groups.push({name: this.nameGroup});
        this.addGroups.push(this.nameGroup)
        this.nameGroup = ''
      },
      async listServiceEdgeNode(payload) {
        return await this.listService({ ...payload, id: this.edgeNodeId, bound: true })
      },
      async deleteServiceEdgeNode(serviceId) {
        return await this.deleteService({ serviceId, edgeNodeId: this.edgeNodeId })
      },
      changeRouteByClickingOnTab(e) {
        if (e.index === 0) {
          this.$router.push({ name: 'edit-edge-node', params: { id: this.edgeNodeId } })
        } else {
          this.$router.push({
            name: 'edit-edge-node-service',
            params: { id: this.edgeNodeId }
          })
        }
      },
      renderTabCurrentRouter() {
        if (this.$route.name === 'edit-edge-node-service') {
          this.activeTab = 1
        } else {
          this.activeTab = 0
        }
      },
    }
  }
</script> -->
