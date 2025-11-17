<template>
  <Dialog
    :visible="visible"
    @update:visible="(v) => emit('update:visible', v)"
    modal
    header="Truncate Table"
    :style="{ width: '36rem' }"
    :pt="{ header: { class: 'text-color-primary' } }"
  >
    <div class="flex flex-col gap-4">
      <p class="text-color-secondary">
        All data in {{ tables.length > 1 ? 'these tables' : 'this table' }} will be permanently
        truncated, removing all data while keeping the column schema intact. Are you sure?
      </p>
      <div
        class="flex flex-col gap-2 self-stretch p-3.5 bg-[var(--surface-300)] rounded-md border surface-border justify-start items-start"
      >
        <div
          class="flex-1 flex justify-start items-start"
          v-for="table in tables"
          :key="table"
        >
          <div class="flex justify-start">
            <span
              class="text-[var(--p-tag-danger-color)] text-sm font-normal font-['Roboto_Mono'] leading-tight"
              >TRUNCATE TABLE
            </span>
            <span class="text-color text-sm font-normal font-['Roboto_Mono'] leading-tight ml-2">
              "{{ table }}"
            </span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 mt-2">
        <PrimeButton
          label="Cancel"
          outlined
          size="small"
          @click="emit('update:visible', false)"
        />
        <PrimeButton
          label="Truncate Table"
          size="small"
          severity="danger"
          @click="truncateTable"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
  import Dialog from 'primevue/dialog'
  import PrimeButton from 'primevue/button'
  import { edgeSQLService } from '@/services/v2/edge-sql/edge-sql-service'
  import { useToast } from 'primevue/usetoast'
  import { capitalizeFirstLetter } from '@/helpers'
  import { useEdgeSQL } from '../composable/useEdgeSQL'

  const toast = useToast()

  const props = defineProps({
    visible: { type: Boolean, default: false },
    tables: { type: Array, default: () => [] }
  })

  const { currentDatabase } = useEdgeSQL()

  const showToast = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: capitalizeFirstLetter(severity),
      detail
    }

    toast.add(options)
  }

  const emit = defineEmits(['update:visible', 'load-tables'])

  const truncateTable = async () => {
    if (!Array.isArray(props.tables) || !props.tables.length) {
      emit('update:visible', false)
      return
    }
    try {
      const tables = props.tables.map((tableName) => `TRUNCATE TABLE ${tableName};`)
      await edgeSQLService.executeDatabase(currentDatabase.value.id, {
        statements: tables
      })
      showToast('success', `Truncated ${props.tables.length} table(s).`)
      emit('load-tables')
    } catch (error) {
      const message = error?.message || error
      if (error && typeof error.showErrors === 'function') error.showErrors(toast)
      else showToast('error', message)
    } finally {
      emit('update:visible', false)
    }
  }
</script>
