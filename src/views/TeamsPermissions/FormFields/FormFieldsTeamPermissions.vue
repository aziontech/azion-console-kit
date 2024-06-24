<!-- eslint-disable vue/no-mutating-props -->
<script setup>
  import { watch, ref, onMounted } from 'vue'

  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import PickList from 'primevue/picklist'
  import { useField } from 'vee-validate'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  const props = defineProps({
    listPermissionService: {
      type: Function,
      required: true
    }
  })

  const permissionsList = ref([])

  const { value: name, errorMessage: errorName } = useField('name')
  const { value: permissions } = useField('permissions')

  const isAlreadySelected = ({ alreadySelectedPermissionsIds, id }) => {
    return alreadySelectedPermissionsIds.includes(id)
  }

  const formAlredyInitialized = ref(false)

  const fetchPermissions = async () => {
    const teamPermissions = await props.listPermissionService()

    const alreadySelectedPermissionsIds =
      permissions.value?.map((permission) => permission.id) || []

    const alreadySelectedPermissions =
      teamPermissions.filter((permission) =>
        alreadySelectedPermissionsIds.includes(permission.id)
      ) || []
    const notSelectedPermissions = teamPermissions.filter(
      (teamPermissionItem) =>
        !isAlreadySelected({ alreadySelectedPermissionsIds, id: teamPermissionItem.id })
    )
    permissionsList.value = [notSelectedPermissions, alreadySelectedPermissions]
  }

  watch(permissionsList, (newPermissions) => {
    if (formAlredyInitialized.value) {
      const selectedPermissions = newPermissions[1]
      permissions.value = selectedPermissions
    }
  })

  onMounted(async () => {
    await fetchPermissions()
    formAlredyInitialized.value = true
  })
</script>
<template>
  <FormHorizontal
    title="General"
    description="Use permissions to manage and oversee users by defining access levels of client accounts.
"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *
        </label>
        <InputText
          v-model="name"
          type="text"
          id="name"
          :class="{ 'p-invalid': errorName }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Give a unique and descriptive name to identify the team.
        </small>
        <small
          v-if="errorName"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorName }}</small
        >
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Permissions"
    description="Determine the access level of accounts and assign permissions according to their team. Teams can be based on the role and tasks of account users.
"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-3xl w-full gap-2">
        <label
          for="value"
          class="text-color text-base font-medium"
          >Permissions *
        </label>
        <PickList
          v-model="permissionsList"
          :pt="{
            sourceList: { class: ['h-80'] },
            targetList: { class: ['h-80'] }
          }"
          dataKey="id"
          breakpoint="1400px"
          :showSourceControls="false"
          :showTargetControls="false"
        >
          <template #sourceheader>Available Permissions</template>
          <template #targetheader>Chosen Permissions</template>
          <template #item="slotProps">
            <div>
              <div>
                <span class="font-normal">{{ slotProps.item.name }}</span>
              </div>
            </div>
          </template>
        </PickList>
        <small class="text-xs text-color-secondary font-normal leading-5">
          Select an item from the list and then use the arrows to move it between the available and
          selected permissions boxes. Use the double-line arrows to move all items or press the
          <code>ctrl</code> or <code>command</code> keys to select multiple items.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal title="Status">
    <template #inputs>
      <FieldSwitchBlock
        nameField="isActive"
        name="active"
        auto
        :isCard="false"
        title="Active"
        subtitle="Activate or deactivate the team permissions for all users assigned to the team."
      />
    </template>
  </FormHorizontal>
</template>
