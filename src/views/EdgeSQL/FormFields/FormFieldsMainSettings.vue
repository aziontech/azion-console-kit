<template>
  <div class="flex flex-col gap-6">
    <FormHorizontal
      title="General"
      description="Set up your new SQL database with basic configuration."
      data-testid="create-database-form-general"
    >
      <template #inputs>
        <div class="flex flex-col sm:max-w-lg w-full gap-2">
          <FieldText
            label="Name"
            name="name"
            placeholder="my-database"
            :value="name"
            description="Give a unique and descriptive name to identify the database."
            data-testid="database-name-field"
            required
          />
        </div>
      </template>
    </FormHorizontal>
    <FormHorizontal title="Status">
      <template #inputs>
        <div class="flex flex-col w-full gap-2">
          <FieldSwitchBlock
            nameField="active"
            name="active"
            :value="active"
            auto
            :isCard="false"
            title="Active"
          />
        </div>
      </template>
    </FormHorizontal>
    <FormHorizontal
      title="Danger Zone"
      severity="danger"
      description=""
    >
      <template #inputs>
        <div>
          <PrimeButton
            data-testid="account-settings__delete-account"
            label="Delete database"
            severity="danger"
            icon="pi pi-trash"
            @click="openDeleteDialog"
          />
        </div>
      </template>
    </FormHorizontal>
  </div>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import { useDeleteDialog } from '@/composables/useDeleteDialog'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { useRoute, useRouter } from 'vue-router'

  import PrimeButton from 'primevue/button'
  import { useField } from 'vee-validate'

  defineOptions({ name: 'form-fields-create-database' })

  const router = useRouter()
  const route = useRoute()

  const { value: name } = useField('name')
  const { value: active } = useField('active')

  const { openDeleteDialog: openDeleteDialogComposable } = useDeleteDialog()

  const deleteDatabase = async () => {
    await edgeSQLService.deleteDatabase(route.params.id)
    router.push({ name: 'sql-database' })
  }

  const openDeleteDialog = () => {
    openDeleteDialogComposable({
      title: 'Delete database',
      message: 'Are you sure you want to delete this database?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmButtonProps: {
        severity: 'danger'
      },
      deleteService: deleteDatabase
    })
  }
</script>
