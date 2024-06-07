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
    description="Install and manage services and resources in real time."
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
            placeholder="My edge node"
            v-model="name"
            type="text"
            :class="{ 'p-invalid': nameError }"
            class="w-full"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Give a unique and descriptive name to identify the edge node.</small
          >
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
    title="Running Settings"
    description="Each node must run the Edge Orchestrator agent, which establishes a communication between your private node and Azion."
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
              placeholder="Hash ID"
              v-model="hashId"
              id="hashId"
              type="text"
              :filled="true"
              :disabled="true"
            />
          </span>
          <small class="text-xs text-color-secondary font-normal leading-5">
            The hash ID used to authenticate the edge node.
          </small>
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
            autoFilterFocus
            optionLabel="name"
            placeholder="Select groups"
            class="w-full"
            display="chip"
          />
          <small class="text-xs text-color-secondary font-normal leading-5">
            Group multiple edge nodes in your edge maps for orchestration and routing.</small
          >
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
