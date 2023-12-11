<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import MultiSelect from 'primevue/multiselect'
  import { useField } from 'vee-validate'
  import { onMounted, ref } from 'vue'
  defineOptions({ name: 'form-fields-edge-node' })

  const props = defineProps({
    listGroupsService: {
      type: Function,
      required: true
    }
  })

  const { value: name, errorMessage: nameError } = useField('name')
  const { value: hashId } = useField('hashId')
  const { value: groups } = useField('groups')
  const groupsList = ref([])

  const fetchGroups = async () => {
    const result = await props.listGroupsService()
    groupsList.value = result
  }

  onMounted(async () => {
    await fetchGroups()
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Description"
  >
    <template #inputs>
      <div class="flex flex-col gap-5 mb-6">
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-base font-medium"
            >Name *</label
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
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Runing Settings"
    description="Each node needs to run the Azion Orchestration software. It enables the communication between your private node and Azion Real-Time Manager, where you can manage your Edge Applications, Edge Functions, and many other Azion services."
  >
    <template #inputs>
      <div class="flex flex-col gap-5 mb-6">
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <label
            for="name"
            class="text-color text-base font-medium"
            >Hash ID</label
          >
          <span class="p-input-icon-right">
            <i class="pi pi-lock text-color-secondary" />
            <InputText
              class="w-full"
              placeholder="HashID"
              v-model="hashId"
              id="hashId"
              type="text"
              :filled="true"
              :disabled="true"
            />
          </span>
        </div>
        <div class="flex flex-col w-full sm:max-w-3xl gap-2">
          <label
            for="select-01"
            class="text-color text-base font-medium"
          >
            Node groups
          </label>
          <MultiSelect
            v-model="groups"
            :options="groupsList"
            filter
            optionLabel="name"
            placeholder="Select groups"
            class="w-full"
            display="chip"
          />
          <small class="text-xs text-color-secondary font-normal leading-tight">
            Use labels to group your Edge Nodes. Groups allow you to manage multiple Edge Nodes
            easily in your Edge Maps for orchestration and routing.</small
          >
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
