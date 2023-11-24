<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Edit Teams Permissions"></PageHeadingBlock>
    </template>
    <template #content>
      <EditFormBlock
        :editService="props.editTeamPermissionService"
        :loadService="props.loadTeamPermissionService"
        :initialDataSetter="setValues"
        :formData="values"
        :formMeta="meta"
        :updatedRedirect="updatedRedirect"
      >
        <template #form>
          <FormHorizontal
            title="Teams Permissions"
            description=""
          >
            <template #inputs>
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <label
                  for="name"
                  class="text-color text-base font-medium"
                  >Name *
                </label>
                <InputText
                  placeholder="Name"
                  v-bind="name"
                  type="text"
                  id="name"
                  :class="{ 'p-invalid': errors.name }"
                />
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
                  <template #targetheader>Chosen Permissions</template>
                  <template #item="slotProps">
                    <div class="flex flex-wrap p-2 align-items-center gap-3">
                      <div class="flex-1 flex flex-column gap-2">
                        <span class="font-bold">{{ slotProps.item.name }}</span>
                      </div>
                    </div>
                  </template>
                </PickList>
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
                <template #subtitle> </template>
              </Card>
            </template>
          </FormHorizontal>
        </template>
      </EditFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import EditFormBlock from '@/templates/edit-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import PickList from 'primevue/picklist'
  import Card from 'primevue/card'
  import InputSwitch from 'primevue/inputswitch'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

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
