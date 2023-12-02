<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputSwitch from 'primevue/inputswitch'
  import InputText from 'primevue/inputtext'
  import Checkbox from 'primevue/checkbox'
  import Card from 'primevue/card'
  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-edge-node' })

  const { value: name, errorMessage: nameError } = useField('name')
  const { value: hashId } = useField('hashId')
  const { value: addService } = useField('addService')
  const { value: groups } = useField('groups')
  const { value: addGroups } = useField('addGroups')
  const { value: nameGroup } = useField('nameGroup')

  const addNewGroup = () => {
    groups.value.push({ name: nameGroup.value })
    addGroups.value.push(nameGroup.value)
    nameGroup.value = ''
  }
</script>

<template>
  <FormHorizontal
    title="Main Settings"
    description="Each node needs to run the Azion Orchestration software. It enables the
                        communication between your private node and Azion Console, where
                        you can manage your Edge Applications, Edge Functions, and many other Azion
                        services."
  >
    <template #inputs>
      <div class="flex flex-col gap-5 mb-6">
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-base font-medium"
            >Name</label
          >
          <InputText
            placeholder="Name"
            v-model="name"
            type="text"
            :class="{ 'p-invalid': nameError }"
            class="w-full"
          />

          <small
            id="username-help"
            class="p-error"
            >{{ nameError }}</small
          >
        </div>

        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-base font-medium"
            >Hash ID</label
          >
          <InputText
            placeholder="HashID"
            v-model="hashId"
            type="text"
            class="w-full"
            :disabled="true"
          />
        </div>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-base font-medium"
            >Node groups</label
          >
          <InputText
            id="groups"
            v-model="nameGroup"
            aria-describedby="groups-help"
            @keyup.enter="addNewGroup"
          />
          <div class="text-color-secondary text-sm font-normal">
            Use labels to group your Edge Nodes. Groups allow you to manage multiple Edge Nodes
            easily in your Edge Maps for orchestration and routing.
          </div>
          <div class="flex gap-2">
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
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Orchestration Modules"
    description="Choose orchestration modules to install on your Edge Node."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <label class="text-color text-base font-medium"></label>
        <div class="flex flex-col gap-3">
          <Card
            :pt="{
              body: { class: 'p-4' },
              title: {
                class: 'flex justify-between items-center text-base font-medium m-0'
              },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Azion Cells</span>
              <InputSwitch
                id="cells"
                :disabled="true"
              />
            </template>
            <template #subtitle
              >Azion Cells is a lightweight software framework to build and run low-latency Edge
              Applications. By activating this option, you agree to install the framework on your
              Edge Node.</template
            >
          </Card>
          <Card
            :pt="{
              body: { class: 'p-4' },
              title: {
                class: 'flex justify-between items-center text-base font-medium m-0'
              },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Azion Health Check</span>
              <InputSwitch
                id="health"
                :disabled="true"
              />
            </template>
            <template #subtitle
              >Azion Health Check is a service that enables your Edge Node to report the
              availability and health constantly to Azion. By activating this option, you agree to
              install the service on your Edge Node.</template
            >
          </Card>
          <Card
            :pt="{
              body: { class: 'p-4' },
              title: {
                class: 'flex justify-between items-center text-base font-medium m-0'
              },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Add-On Services</span>
              <InputSwitch
                id="service"
                v-model="addService"
              />
            </template>
            <template #subtitle
              >Enables you to instantiate add-on services from your own Services Library.</template
            >
          </Card>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
