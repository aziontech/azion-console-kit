<template>
  <DataTable removableSort  :value="data" dataKey="id" filterDisplay="row" v-model:filters="this.filters" paginator
    :rowsPerPageOptions="[10, 20, 50, 100]" :rows="10" :globalFilterFields="filterBy" :loading="isLoading">
    <template #header>
      <div class="flex self-start">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <InputText class="w-full" v-model="this.filters.global.value" placeholder="Search" />
        </span>
      </div>
    </template>
    <Column sortable v-for="col of columns" :key="col.field" :field="col.field" :header="col.header" />
    <Column>
      <template #body="{ data }">
        <div class="flex justify-end">
          <PrimeButton v-tooltip="'Actions'" size="small" icon="pi pi-ellipsis-h" text
            @click="(event) => toggleActionsMenu(event, data.id)" class="cursor-pointer" />
          <PrimeMenu ref="menu" id="overlay_menu" v-bind:model="actionOptions" :popup="true" />
        </div>
      </template>
    </Column>
  </DataTable>
</template>


<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import PrimeMenu from 'primevue/menu';
import PrimeButton from 'primevue/button';
import { FilterMatchMode } from 'primevue/api';
export default {
  name: 'list-template',
  components: {
    DataTable,
    Column,
    InputText,
    PrimeButton,
    PrimeMenu,
  },
  data: () => ({
    showActionsMenu: false,
    selectedId: null,
    filters: {
      global: { value: '', matchMode: FilterMatchMode.CONTAINS },
    },
    isLoading:false,
    data:[]
  }),
  props: {
    columns: {
      type: Array,
      required: true,
      default: () => [{
        field: 'id',
        header: 'Identifier'
      }, {
        field: 'name',
        header: 'Name'
      }]
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
    listService:{
      required:true,
      type:Function
    }
  },
  async created(){
    await this.loadInitialData()
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
    async loadInitialData(){
      this.isLoading = true;
      const data = await this.listService({page:1})
      this.data = data;
      this.isLoading = false;
    },
    toggleActionsMenu(event, selectedId) {
      console.log(selectedId);
      this.selectedId = selectedId;
      this.$refs.menu.toggle(event);
    },
    editItem() {
      console.log(this.selectedId);
    },
    removeItem() {
      console.log(this.selectedId);
    }
  }


}

</script>