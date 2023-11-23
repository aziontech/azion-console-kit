<template>
  <CreateFormBlock
    pageTitle="Create Team Permissions"
    :createService="props.createTeamPermissionsService"
    :formData="values"
    :formMeta="meta"
    :cleanFormCallback="resetForm"
  >
    <template #form>
      <FormHorizontal
        title="Teams Permissions"
        description="Use permissions to manage and oversee users by defining access levels of client accounts. Teams can be created based on the role and tasks of assigned clients."
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
              Choose a type of permission from the list and then use the right arrow
              to move it to the selected permissions field. Use the double-line arrows to move all
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
  </CreateFormBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import PickList from 'primevue/picklist'
  import Card from 'primevue/card'
  import InputSwitch from 'primevue/inputswitch'

  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'
  import { ref, onMounted, watch } from 'vue'
  const props = defineProps({
    createTeamPermissionsService: {
      type: Function,
      required: true
    },
    listPermissionService: {
      type: Function,
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

  const { errors, defineInputBinds, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      permissions: [],
      isActive: true
    }
  })

  const name = defineInputBinds('name', { validateOnInput: true })
  const isActive = defineInputBinds('isActive', { validateOnInput: true })
  const { value: permissions } = useField('permissions')

  const fetchPermissions = async () => {
    const result = await props.listPermissionService()
    permissionsList.value = [result, []]
  }

  onMounted(async () => {
    await fetchPermissions()
  })

  watch(permissionsList, (newPermissions) => {
    permissions.value = newPermissions[1]
  })
</script>
