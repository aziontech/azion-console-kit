<template>
  <EditFormBlock
    pageTitle="Edit Team Permissions"
    :editService="props.editTeamPermissionService"
    :loadService="props.loadTeamPermissionService"
    :initialDataSetter="setValues"
    :formData="values"
    :formMeta="meta"
    :updatedRedirect="updatedRedirect"
  >
    <template #form>
      <FormHorizontal
        title="Team Permissions"
        description="Use permissions to manage and oversee users by dictating and refining access levels of client accounts. Teams can be created based on the role and tasks of assigned clients."
      >
        <template #inputs>
          <div class="flex flex-col sm:max-w-lg w-full gap-2">
            <label
              for="name"
              class="text-color text-base font-medium"
              >Name *
            </label>
            <InputText
              placeholder="My team"
              v-bind="name"
              type="text"
              id="name"
              :class="{ 'p-invalid': errors.name }"
            />
            <small class="text-xs text-color-secondary font-normal leading-tight">
              Give a unique and easy-to-remember name.
            </small>
            <small
              v-if="errors.name"
              class="p-error text-xs font-normal leading-tight"
              >{{ errors.name }}</small
            >
          </div>

          <div class="flex flex-col sm:max-w-3xl w-full gap-2">
            <label
              for="value"
              class="text-color text-base font-medium"
              >Permissions *
            </label>
            <PickList
              v-model="permissionsList"
              listStyle="height:342px"
              dataKey="id"
              breakpoint="1400px"
              :showSourceControls="false"
              :showTargetControls="false"
            >
              <template #sourceheader>Available Permissions</template>
              <template #targetheader>Selected Permissions</template>
              <template #item="slotProps">
                <div class="flex flex-wrap p-2 align-items-center gap-3">
                  <div class="flex-1 flex flex-column gap-2">
                    <span class="font-bold">{{ slotProps.item.name }}</span>
                  </div>
                </div>
              </template>
            </PickList>
            <small class="text-xs text-color-secondary font-normal leading-tight">
              Choose from the available permissions by clicking the permission and the right arrow
              to move it to the selected permissions. Use the double line arrows to move all
              permissions.
            </small>
          </div>

          <Card
            :pt="{
              body: { class: 'p-4' },
              title: { class: 'flex justify-between items-center text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Active</span>
              <InputSwitch
                v-bind="isActive"
                v-model="isActive.value"
                :class="{ 'p-invalid': errors.isActive }"
              />
            </template>
            <template #subtitle>
              Activate or deactivate the team permissions for all clients within the team.
            </template>
          </Card>
        </template>
      </FormHorizontal>
    </template>
  </EditFormBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import PickList from 'primevue/picklist'
  import Card from 'primevue/card'
  import InputSwitch from 'primevue/inputswitch'

  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { ref, onMounted, watch } from 'vue'
  const props = defineProps({
    editTeamPermissionService: {
      type: Function,
      required: true
    },
    loadTeamPermissionService: {
      type: Function,
      required: true
    },
    listPermissionService: {
      type: Function,
      required: true
    },
    updatedRedirect: {
      type: String,
      required: true
    }
  })
  //Validation Schema
  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    permissions: yup.array().required('Permission is a required field').min(1),
    isActive: yup.boolean()
  })

  const permissionsList = ref(null)

  const { errors, defineInputBinds, meta, values, setValues } = useForm({
    validationSchema
  })

  const name = defineInputBinds('name', { validateOnInput: true })
  const isActive = defineInputBinds('isActive', { validateOnInput: true })
  const { value: permissions } = useField('permissions')

  const fetchPermissions = async () => {
    const response = await props.listPermissionService()

    const filterResponse = response.filter(
      (item) => !permissions.value.some((permission) => permission.id === item.id)
    )
    permissionsList.value = [filterResponse, permissions.value]
  }

  onMounted(async () => {
    await fetchPermissions()
  })

  watch(permissionsList, (newPermissions) => {
    permissions.value = newPermissions[1]
  })
</script>
