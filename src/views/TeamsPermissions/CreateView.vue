<template>
  <ContentBlock>
    <template #heading>
      <PageHeadingBlock pageTitle="Create Teams Permissions"></PageHeadingBlock>
    </template>
    <template #content>
      <CreateFormBlock
        :createService="props.createTeamPermissionsService"
        :formData="values"
        :formMeta="meta"
        :cleanFormCallback="resetForm"
      >
        <template #form>
          <FormHorizontal
            title="General"
            description="Description"
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
                  :class="{ 'p-invalid': errors.name }"
                />
                <small
                  v-if="errors.name"
                  class="p-error text-xs font-normal leading-tight"
                  >{{ errors.name }}</small
                >
              </div>
            </template>
          </FormHorizontal>
          <FormHorizontal
            title="Teams Permissions"
            description="Select the teams permissions"
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
                    <div class="flex flex-wrap p-2 align-items-center gap-3">
                      <div class="flex-1 flex flex-column gap-2">
                        <span class="font-normal">{{ slotProps.item.name }}</span>
                      </div>
                    </div>
                  </template>
                </PickList>
              </div>
            </template>
          </FormHorizontal>
          <FormHorizontal title="Status">
            <template #inputs>
              <div class="flex flex-col w-full gap-2">
                <div
                  class="flex gap-6 md:align-items-center max-sm:flex-col max-sm:align-items-baseline max-sm:gap-3"
                >
                  <span class="p-input-icon-right w-full flex max-w-lg items-start gap-2 pb-3 pt-2">
                    <InputSwitch
                      v-model="isActive"
                      id="active"
                    />
                    <div class="flex-col gap-1">
                      <div class="text-color text-sm font-normal leading-5">Active</div>
                    </div>
                  </span>
                </div>
              </div>
            </template>
          </FormHorizontal>
        </template>
      </CreateFormBlock>
    </template>
  </ContentBlock>
</template>

<script setup>
  import CreateFormBlock from '@/templates/create-form-block-new'
  import FormHorizontal from '@/templates/create-form-block-new/form-horizontal'
  import InputText from 'primevue/inputtext'
  import PickList from 'primevue/picklist'
  import InputSwitch from 'primevue/inputswitch'
  import ContentBlock from '@/templates/content-block'
  import PageHeadingBlock from '@/templates/page-heading-block'

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
  const permissionsList = ref(null)

  //Validation Schema
  const validationSchema = yup.object({
    name: yup.string().required('Name is a required field'),
    permissions: yup.array().required('Permission is a required field').min(1),
    isActive: yup.boolean()
  })

  const { errors, meta, resetForm, values } = useForm({
    validationSchema,
    initialValues: {
      name: '',
      permissions: [],
      isActive: true
    }
  })
  const { value: name } = useField('name')
  const { value: isActive } = useField('isActive')
  const { value: permissions } = useField('permissions')

  const fetchPermissions = async () => {
    const availablePermissions = await props.listPermissionService()
    const selectedPermissions = []
    permissionsList.value = [availablePermissions, selectedPermissions]
  }

  onMounted(async () => {
    await fetchPermissions()
  })

  watch(permissionsList, (newPermissions) => {
    permissions.value = newPermissions[1]
  })
</script>
