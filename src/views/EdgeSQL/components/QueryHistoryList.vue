<template>
  <div class="flex flex-col w-full gap-4 min-h-0">
    <h3 class="text-lg font-medium text-color-primary">Query History</h3>
    <div class="p-input-icon-left">
      <i class="pi pi-search" />
      <InputText
        :modelValue="searchTerm"
        @update:modelValue="(v) => emit('update:searchTerm', v)"
        placeholder="Search queries"
        class="w-full"
      />
    </div>

    <div class="flex-1 min-h-0 overflow-y-auto !w-64">
      <div
        v-if="isLoading"
        class="flex flex-col gap-3"
      >
        <div
          v-for="index in 3"
          :key="index"
          class="py-2 rounded"
        >
          <div class="flex items-center justify-between">
            <Skeleton class="h-8 w-full" />
          </div>
        </div>
      </div>

      <div
        v-else-if="!history?.length"
        class="text-left py-2"
      >
        <div class="text-color-secondary text-sm">
          {{ searchTerm ? 'No queries found.' : 'No queries created yet.' }}
        </div>
      </div>

      <div v-else>
        <div
          v-for="query in history"
          :key="query.id"
          class="group p-2 rounded cursor-pointer hover:bg-[--table-bg-color] transition-colors"
          :class="{ 'bg-[--table-bg-color]': selectedQueryId === query.id }"
          @click="emit('select', query)"
        >
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-color-primary truncate">
              {{ query.originalQuery }}
            </span>
            <Button
              icon="pi pi-ellipsis-h"
              size="small"
              outlined
              @click.stop="emit('open-menu', $event, query)"
              data-testid="table-menu-button"
              class="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import InputText from 'primevue/inputtext'
  import Skeleton from 'primevue/skeleton'
  import Button from 'primevue/button'

  const emit = defineEmits(['update:searchTerm', 'select', 'open-menu'])

  defineProps({
    isLoading: { type: Boolean, default: false },
    history: { type: Array, default: () => [] },
    selectedQueryId: { type: [String, Number, null], default: null },
    searchTerm: { type: String, default: '' }
  })
</script>
