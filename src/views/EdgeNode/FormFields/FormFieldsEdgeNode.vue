<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'

  import MultiSelect from '@aziontech/webkit/multiselect'
  import { useField } from 'vee-validate'
  import { onMounted, ref } from 'vue'
  defineOptions({ name: 'form-fields-edge-node' })

  const props = defineProps({
    listGroupsService: {
      type: Function,
      required: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  })

  const { value: groups } = useField('groups')

  const groupsList = ref([])
  const loadingGroups = ref(false)

  const fetchGroups = async () => {
    loadingGroups.value = true
    try {
      const result = await props.listGroupsService()
      groupsList.value = result
    } finally {
      loadingGroups.value = false
    }
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
      <FieldText
        label="Name"
        required
        description="Give a unique and descriptive name to identify the edge node."
        name="name"
        placeholder="My edge node"
      />
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Running Settings"
    description="Each node must run the Orchestrator agent, which establishes a communication between your private node and Azion."
  >
    <template #inputs>
      <div class="flex flex-col gap-5 mb-6">
        <FieldText
          label="Hash ID"
          description="The hash ID used to authenticate the edge node."
          name="hashId"
          disabled
          placeholder="Hash ID"
          filled
          icon="pi pi-lock"
        />
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
            :loading="loadingGroups"
            :disabled="loadingGroups"
            filter
            autoFilterFocus
            optionLabel="name"
            :placeholder="loadingGroups ? 'Loading groups...' : 'Select groups'"
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

  <FormHorizontal
    title="Orchestration Modules"
    description="Choose orchestration modules to install on your Edge Node."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldSwitchBlock
          nameField="hasServices"
          name="hasServices"
          rootClass="w-full"
          auto
          isCard
          :disabled="props.loading"
          title="Add-On Services"
          subtitle="Enables you to instantiate add-on services from your own Services Library."
        />
      </div>
    </template>
  </FormHorizontal>
</template>
