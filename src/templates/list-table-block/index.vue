<template>
  <Toast />
  <header class="border-neutral-200  border-b min-h-[82px] w-full flex items-center">
    <div class="p-4 w-full">
      <div class="flex flex-col md:flex-row justify-between gap-4">
        <h1 class="text-4xl self-center font-normal text-gray-600">{{ pageTitle }}</h1>
        <PrimeButton @click="navigateToAddPage" icon="pi pi-plus" :label="addButtonLabel" v-if="addButtonLabel" />
      </div>
    </div>
  </header>
  <div class="max-w-screen-sm lg:max-w-7xl mx-auto">

    <DataTable v-if="!isLoading" scrollable removableSort :value="data" dataKey="id" v-model:filters="this.filters"
      paginator :rowsPerPageOptions="[5, 10, 20, 50, 100]" :rows="5" :globalFilterFields="filterBy" :loading="isLoading">
      <template #header>
        <div class="flex self-start">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText class="w-full" v-model="this.filters.global.value" placeholder="Search" />
          </span>
        </div>
      </template>
      <Column sortable v-for="col of columns" :key="col.field" :field="col.field" :header="col.header" />
      <Column :frozen="true" :alignFrozen="'right'">
        <template #body="{ data }">
          <div class="flex justify-end">
            <PrimeButton v-tooltip="'Actions'" size="small" icon="pi pi-ellipsis-h" text
              @click="(event) => toggleActionsMenu(event, data.id)" class="cursor-pointer" />
            <PrimeMenu ref="menu" id="overlay_menu" v-bind:model="actionOptions" :popup="true" />
          </div>
        </template>
      </Column>
      <template #empty>
        <div class="my-4 flex flex-col gap-3 justify-center items-center">
          <p class="text-xl font-normal text-gray-600"> No registers found. </p>
          <PrimeButton text icon="pi pi-plus" label="Add" @click="navigateToAddPage"/>
        </div>
      </template>

    </DataTable>

    <DataTable v-else :value="Array(5)" :pt="{
        header: { class: '!border-t-0' },
      }">
      <template #header>
        <div class="flex self-start">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText  class="w-full" v-model="this.filters.global.value" placeholder="Search" />
          </span>
        </div>
      </template>
      <Column sortable v-for="col of columns" :key="col.field" :field="col.field" :header="col.header">
        <template #body>
          <Skeleton></Skeleton>
        </template>
      </Column>
    </DataTable>
  </div>
</template>


<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Toast from 'primevue/toast'
import InputText from 'primevue/inputtext';
import PrimeMenu from 'primevue/menu';
import Skeleton from 'primevue/skeleton';
import PrimeButton from 'primevue/button';
import { FilterMatchMode } from 'primevue/api';

export default {
  name: 'list-table-block',
  components: {
    Toast,
    DataTable,
    Column,
    InputText,
    PrimeButton,
    PrimeMenu,
    Skeleton,
  },
  data: () => ({
    showActionsMenu: false,
    selectedId: null,
    filters: {
      global: { value: '', matchMode: FilterMatchMode.CONTAINS },
    },
    isLoading: false,
    data: []
  }),
  props: {
    columns: {
      type: Array,
      required: true,
      default: () => [{
        field: 'name',
        header: 'Name'
      }]
    },
    pageTitle: {
      type: String,
      required: true
    },
    createPagePath: {
      type: String,
      required: true,
      default: () => '#'
    },
    addButtonLabel: {
      type: String,
      required: true,
      default: () => ''
    },
    listService: {
      required: true,
      type: Function
    },
    deleteService: {
      required: true,
      type: Function
    }
  },
  async created() {
    await this.loadData({ page: 1 })
  },
  computed: {
    actionOptions() {
      return [
        {
          label: 'Edit',
          icon: 'pi pi-fw pi-pencil',
          command: () => this.editItem()
        },
        {
          label: 'Delete',
          icon: 'pi pi-fw pi-trash',
          command: () => this.removeItem()
        }
      ]
    },
    filterBy() {
      return this.columns.map(item => item.field);
    }
  },
  methods: {
    async loadData({ page }) {
      try {
        this.isLoading = true;
        const data = await this.listService({ page })
        this.data = data;
      } catch (error) {
        this.$toast.add({
          closable: true,
          severity: 'error',
          summary: error,
          life: 10000
        })
      } finally {
        this.isLoading = false
      }
    },
    navigateToAddPage() {
      this.$router.push(this.createPagePath)
    },
    toggleActionsMenu(event, selectedId) {
      this.selectedId = selectedId;
      this.$refs.menu.toggle(event);
    },
    editItem() {
      alert(this.selectedId)
    },
    async removeItem() {
      let toastConfig = {
        closable: true,
        severity: 'success',
        summary: 'Deleted successfully',
        life: 10000
      }
      try {
        this.$toast.add({
          closable: true,
          severity: 'info',
          summary: 'Processing request',
          life: 5000
        })
        await this.deleteService(this.selectedId);
        this.data = this.data.filter(item => item.id !== this.selectedId)
      } catch (error) {
        toastConfig = {
          closable: true,
          severity: 'error',
          summary: error,
          life: 10000
        }
      } finally {
        this.$toast.add(toastConfig);
      }
    },
  }
}

</script>