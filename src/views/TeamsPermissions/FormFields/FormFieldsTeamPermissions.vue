<!-- eslint-disable vue/no-mutating-props -->
<script setup>
  import { watch, ref, onMounted } from 'vue'
  import PickList from '@aziontech/webkit/picklist'
  import Skeleton from '@aziontech/webkit/skeleton'
  import { useField } from 'vee-validate'
  import LabelBlock from '@aziontech/webkit/label'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldSwitchBlock from '@aziontech/webkit/field-switch-block'

  const props = defineProps({
    listPermissionService: {
      type: Function,
      required: true
    }
  })

  const permissionsList = ref([])
  const formAlredyInitialized = ref(false)
  const loadingPermissions = ref(true)

  const { value: name } = useField('name')
  const { value: permissions, errorMessage: errorPermissions } = useField('permissions')

  const isAlreadySelected = ({ alreadySelectedPermissionsIds, id }) => {
    return alreadySelectedPermissionsIds.includes(id)
  }

  const fetchPermissions = async () => {
    try {
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
    } finally {
      loadingPermissions.value = false
    }
  }

  watch(permissionsList, (newPermissions) => {
    if (!formAlredyInitialized.value) return

    const selectedPermissions = newPermissions[1]
    permissions.value = selectedPermissions
  })

  onMounted(async () => {
    await fetchPermissions()
    formAlredyInitialized.value = true
  })
</script>
<template>
  <FormHorizontal
    data-testid="teams-permissions-form__section__general"
    title="General"
    description="Use permissions to manage and oversee users by defining access levels of client accounts."
  >
    <template #inputs>
      <FieldText
        data-testid="teams-permissions-form__name__field-text"
        label="Name"
        required
        name="name"
        :value="name"
        description="Give a unique and descriptive name to identify the team."
      />
    </template>
  </FormHorizontal>

  <FormHorizontal
    data-testid="teams-permissions-form__section__permissions"
    title="Permissions"
    description="Determine the access level of accounts and assign permissions according to their team. Teams can be based on the role and tasks of account users."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-3xl w-full gap-2">
        <LabelBlock
          data-testid="teams-permissions-form__permissions-field__label"
          label="Permissions"
          isRequired
        />
        <div
          v-if="loadingPermissions"
          class="flex flex-col min-[1400px]:flex-row gap-4 w-full"
          data-testid="teams-permissions-form__permissions-field__skeleton"
        >
          <Skeleton
            width="100%"
            height="20rem"
          />
          <div class="flex flex-row min-[1400px]:flex-col items-center justify-center gap-2">
            <Skeleton
              width="2rem"
              height="2rem"
            />
            <Skeleton
              width="2rem"
              height="2rem"
            />
            <Skeleton
              width="2rem"
              height="2rem"
            />
            <Skeleton
              width="2rem"
              height="2rem"
            />
          </div>
          <Skeleton
            width="100%"
            height="20rem"
          />
        </div>
        <PickList
          v-else
          data-testid="teams-permissions-form__permissions-field__picklist"
          v-model="permissionsList"
          :pt="{
            sourceList: {
              class: ['h-80'],
              'data-testid': 'teams-permissions-form__permissions-field-picklist__source-list'
            },
            targetList: {
              class: ['h-80'],
              'data-testid': 'teams-permissions-form__permissions-field-picklist__target-list'
            }
          }"
          :move-all-to-source-props="{
            'data-testid':
              'teams-permissions-form__permissions-field-picklist__move-all-to-source-btn'
          }"
          :move-all-to-target-props="{
            'data-testid':
              'teams-permissions-form__permissions-field-picklist__move-all-to-target-btn'
          }"
          :move-to-target-props="{
            'data-testid': 'teams-permissions-form__permissions-field-picklist__move-to-target-btn'
          }"
          :move-to-source-props="{
            'data-testid': 'teams-permissions-form__permissions-field-picklist__move-to-source-btn'
          }"
          source-selection="multiple"
          target-selection="single"
          listStyle="height: 400px"
          name="permissions"
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
                <span
                  class="font-normal"
                  :data-testid="`teams-permissions-form__permissions-field__picklist__item-${slotProps.item.name}`"
                  >{{ slotProps.item.name }}</span
                >
              </div>
            </div>
          </template>
        </PickList>
        <small
          class="text-xs text-color-secondary font-normal leading-5"
          data-testid="teams-permissions-form__permissions-field__description"
        >
          Select an item from the list and then use the arrows to move it between the available and
          selected permissions boxes. Use the double-line arrows to move all items or press the
          <code>ctrl</code> or <code>command</code> keys to select multiple items.
        </small>
        <small
          v-if="errorPermissions"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ errorPermissions }}
        </small>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Status"
    data-testid="teams-permissions-form__section__status"
  >
    <template #inputs>
      <FieldSwitchBlock
        data-testid="teams-permissions-form__status-field__switch"
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
