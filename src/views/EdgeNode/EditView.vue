<!-- eslint-disable vue/require-prop-type-constructor -->
<!-- eslint-disable vue/valid-define-props -->
<!-- eslint-disable vue/valid-define-props -->
<template>
  <div>
    <PageHeadingBlock pageTitle="Edit Edge Node">
      <template #tabs>
        <TabView
          :activeIndex="state.activeTab"
          @tab-click="changeRouteByClickingOnTab"
          class="w-full"
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
                <FormHorizontal title="Edit Edge Node">
                  <template #inputs>
                    <div class="flex flex-col gap-5 mb-6">
                      <h2 class="text-2xl">Main Settings</h2>
                      <div>
                        <InputText
                          placeholder="Name"
                          v-bind="name"
                          type="text"
                          :class="{ 'p-invalid': errors.name }"
                          class="w-full"
                        />
                        <small
                          id="username-help"
                          class="p-error"
                          >{{ errors.name }}</small
                        >
                      </div>
                      <p>
                        Each node needs to run the Azion Orchestration software. It enables the
                        communication between your private node and Azion Real-Time Manager, where
                        you can manage your Edge Applications, Edge Functions, and many other Azion
                        services.
                      </p>
                      <div class="flex flex-col gap-2">
                        <InputText
                          placeholder="HashID"
                          v-bind="hashId"
                          type="text"
                          class="w-full"
                          :disabled="true"
                        />
                      </div>
                      <div class="flex flex-col gap-2">
                        <label for="groups">Node groups</label>
                        <small id="groups-help"
                          >Use labels to group your Edge Nodes. Groups allow you to manage multiple
                          Edge Nodes easily in your Edge Maps for orchestration and routing.</small
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
                            :disabled="true"
                          />
                        </div>
                        <small>
                          Azion Cells is a lightweight software framework to build and run
                          low-latency Edge Applications. By activating this option, you agree to
                          install the framework on your Edge Node.
                        </small>
                      </div>
                      <div class="flex flex-col gap-3">
                        <div class="flex justify-between">
                          <label for="health">Azion Health Check</label>
                          <InputSwitch
                            id="health"
                            :disabled="true"
                          />
                        </div>
                        <small>
                          Azion Health Check is a service that enables your Edge Node to report the
                          availability and health constantly to Azion. By activating this option,
                          you agree to install the service on your Edge Node.
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
                </FormHorizontal>
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
      </template>
    </PageHeadingBlock>
  </div>
</template>
<script setup>
  import { reactive, ref, onMounted, onBeforeUpdate } from 'vue'
  import { useField, useForm } from 'vee-validate'
  import * as yup from 'yup'
  import { useRoute, useRouter } from 'vue-router'
  import EditFormBlock from '@/templates/edit-form-block/no-header'
  import PageHeadingBlock from '@/templates/page-heading-block-tabs'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'

  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'
  import ListTableBlock from '@templates/list-table-block'
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import Checkbox from 'primevue/checkbox'

  const pros = defineProps({
    loadEdgeNodeService: { type: Function, required: true },
    editEdgeNodeService: { type: Function, required: true },
    listServiceEdgeNodeService: { type: Function, required: true },
    deleteEdgeNodeService: { type: Function, required: true }
  })

  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    hashId: yup.string().required('HashID is a required field'),
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
    activeTab: 0
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
    await pros.listServiceEdgeNodeService({ ...payload, id: route.params.id, bound: true })

  const deleteServiceEdgeNode = async (serviceId) =>
    await pros.deleteEdgeNodeService({ serviceId, edgeNodeId: edgeNodeId.value })

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
