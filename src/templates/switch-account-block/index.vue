<script setup>
  import { columnBuilder } from '@/components/list-table/columns/column-builder'
  // TODO: migrate import to @aziontech/webkit/list-data-table when published
  import DataTable from '@aziontech/webkit/list-data-table'
  import PrimeButton from '@aziontech/webkit/button'
  import PrimeCard from '@aziontech/webkit/card'
  import PrimeDialog from '@aziontech/webkit/dialog'
  import Divider from '@aziontech/webkit/divider'
  import Dropdown from '@aziontech/webkit/dropdown'
  import InlineMessage from '@aziontech/webkit/inlinemessage'
  import InputText from '@aziontech/webkit/inputtext'
  import Skeleton from '@aziontech/webkit/skeleton'
  import Menu from '@aziontech/webkit/menu'
  import PrimeTag from '@aziontech/webkit/tag'
  import { computed, onMounted, ref, watch } from 'vue'

  defineOptions({ name: 'SwitchAccountBlock' })
  const emit = defineEmits(['update:showSwitchAccount'])
  const props = defineProps({
    accessMenu: {
      type: Array,
      required: true
    },
    showSwitchAccount: {
      type: Boolean,
      required: false,
      default: false
    },
    account: {
      type: Object,
      required: true
    },
    listTypeAccountService: {
      type: Function,
      required: true
    },
    visibleButton: {
      type: Boolean,
      default: true
    },
    accountHandler: {
      type: Object,
      required: true
    }
  })

  const visible = ref(false)
  const filterSwitch = ref({
    textSnippet: '',
    type: 'brands'
  })
  const filterType = ref([
    { label: 'Brands', value: 'brands' },
    { label: 'Resellers', value: 'resellers' },
    { label: 'Groups', value: 'groups' },
    { label: 'Clients', value: 'clients' }
  ])
  const columns = ref([
    {
      field: 'name',
      header: 'Name',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'clickable-link',
          dependencies: {
            clickAction: onSelectedAccount,
            clickProps: columnData.value
          }
        })
    },
    {
      field: 'type',
      header: 'Type',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'tag'
        })
    },
    {
      field: 'id',
      header: 'ID'
    },
    {
      field: 'clientID',
      header: 'Client ID'
    }
  ])
  const menu = ref()

  // Lazy loading state (previously managed by with-lazy-and-dropdown-filter.vue)
  const isLoading = ref(false)
  const first = ref(1)
  const limitRows = ref(10)
  const errorMessage = ref(null)
  const listRecords = ref([])
  const filters = ref(filterSwitch.value)
  const totalRecords = ref(0)
  const pageInitial = 1
  const limitShowRows = 10

  const isLoadingAccount = computed(() => !props.account?.accountTypeIcon)

  const loadData = async ({ page = pageInitial, pageSize = limitShowRows } = {}) => {
    try {
      isLoading.value = true
      listRecords.value = []
      const { results, totalPages } = await props.listTypeAccountService({
        page,
        pageSize,
        ...filters.value
      })
      totalRecords.value = totalPages * limitShowRows
      listRecords.value = results
    } catch (error) {
      errorMessage.value = error
    } finally {
      isLoading.value = false
    }
  }

  const applyFilter = () => {
    limitRows.value = limitShowRows
    first.value = 1
    loadData({ page: 1 })
  }

  const onPage = (event) => {
    const page = event.page + pageInitial
    loadData({ page, pageSize: event.rows })
  }

  const onRowSelect = (event) => {
    onSelectedAccount(event.data)
  }

  onMounted(async () => {
    await loadData()
  })

  watch(
    () => props.showSwitchAccount,
    (newValue) => {
      visible.value = newValue
    }
  )

  const visibleDialog = (value) => {
    emit('update:showSwitchAccount', value)
    visible.value = value
  }
  const toggle = (event) => {
    menu.value.toggle(event)
  }
  const onSelectedAccount = async (rowSelected) => {
    visible.value = false
    await props.accountHandler.switchAccountAndRedirect(rowSelected.accountId)
  }
</script>

<template>
  <div>
    <PrimeButton
      v-if="visibleButton"
      class="font-semibold h-8 w-auto truncate max-w-[180px] border-header hidden md:flex gap-2 items-center bg-header hover:bg-header-button-hover"
      size="small"
      :loading="isLoadingAccount"
      :pt="{
        label: { class: '!text-white' },
        icon: { class: '!text-white' }
      }"
      v-tooltip.bottom="{ value: 'Switch account', showDelay: 200 }"
      @click="visibleDialog(true)"
    >
      <i
        class="text-white"
        :class="account.accountTypeIcon"
      />
      <span class="truncate text-white"> {{ account.name }}</span>
    </PrimeButton>

    <PrimeDialog
      :blockScroll="true"
      v-model:visible="visible"
      @update:visible="visibleDialog"
      modal
      :breakpoints="{ '460px': '95vw' }"
      :pt="{
        root: { class: 'p-0 w-[880px] h-[632px] mx-3 sm:mx-8 md:mx-8' },
        header: { class: 'px-8 py-3 gap-3' },
        content: { class: 'p-0 h-full' }
      }"
    >
      <template #header>
        <h4 class="w-full text-xl not-italic font-medium leading-7">Switch Account</h4>
      </template>
      <div class="p-8 flex flex-col gap-8 max-sm:gap-6">
        <PrimeCard
          class="w-fit"
          :pt="{
            root: 'max-sm:w-full',
            body: 'max-sm:w-full',
            content: 'p-4 rounded-md gap-4 border-solid flex flex justify-between sm:p-3'
          }"
        >
          <template #content>
            <div
              class="flex gap-4 items-center justify-center max-sm:gap-3 max-sm:flex-col max-sm:items-start max-sm:w-full"
            >
              <div class="flex justify-between items-center self-stretch">
                <h3 class="text-lg font-medium">
                  {{ account.name }}
                </h3>
                <PrimeButton
                  icon="pi pi-cog"
                  type="button"
                  outlined
                  class="hidden max-sm:flex flex-shrink-0"
                  aria-label="menu"
                  aria-haspopup="true"
                  aria-controls="overlay_menu"
                  @click="toggle"
                />
              </div>

              <Divider
                class="max-sm:hidden"
                layout="vertical"
              />
              <Divider class="hidden max-sm:block" />

              <div class="flex items-center gap-2">
                <div class="flex gap-1">
                  <span class="font-medium text-sm">ID</span>
                  <span class="font=normal text-sm">{{ account.id }}</span>
                </div>
                <div
                  v-if="account.client_id"
                  class="flex gap-1"
                >
                  <span class="font-medium text-sm">Client ID</span>
                  <span class="font=normal text-sm">{{ account.client_id }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <PrimeTag
                  :value="account.accountTypeName"
                  :icon="account.accountTypeIcon"
                  severity="info"
                />
                <PrimeTag
                  value="Current Logged"
                  severity="success"
                />
              </div>
            </div>

            <PrimeButton
              icon="pi pi-cog"
              type="button"
              outlined
              class="max-sm:hidden"
              aria-label="menu"
              aria-haspopup="true"
              aria-controls="overlay_menu"
              @click="toggle"
            />
            <Menu
              :pt="{
                content: { class: 'p-0' }
              }"
              ref="menu"
              id="overlay_menu"
              :model="accessMenu"
              @toggle="visible = false"
              :popup="true"
            />
          </template>
        </PrimeCard>

        <div class="max-w-full">
          <div class="flex flex-col items-start gap-2 mb-4 self-stretch w-full">
            <div class="text-xl font-medium">Accounts List</div>
            <div class="text-sm font-normal leading-[normal] text-color-secondary">
              Type the account name to filter results.
            </div>
          </div>

          <InlineMessage
            v-if="errorMessage"
            class="mb-4"
            severity="error"
          >
            {{ errorMessage }}
          </InlineMessage>

          <DataTable
            v-show="!isLoading"
            :data="listRecords"
            :columns="columns"
            :loading="false"
            dataKey="id"
            lazy
            :paginator="totalRecords > limitShowRows"
            :rows="limitRows"
            :rowsPerPageOptions="[10, 20, 50, 100]"
            :totalRecords="totalRecords"
            :first="first"
            :notShowEmptyBlock="true"
            emptyListMessage="No accounts found."
            @page="onPage($event)"
            @rowClick="onRowSelect"
            :pt="{
              root: { class: 'border surface-border rounded' },
              header: { class: 'p-3.5' }
            }"
            tableClass="p-datatable-sm"
          >
            <template #header>
              <div class="flex flex-wrap justify-between gap-2 w-full rounded">
                <span class="p-input-icon-left max-sm:w-full">
                  <i class="pi pi-search" />
                  <InputText
                    class="md:w-20rem max-sm:w-full"
                    v-model.trim="filters.textSnippet"
                    @keyup.enter="applyFilter()"
                    placeholder="Search by name or ID"
                  />
                </span>

                <Dropdown
                  appendTo="body"
                  @change="applyFilter"
                  :options="filterType"
                  class="md:w-14rem max-sm:w-full"
                  optionLabel="label"
                  optionValue="value"
                  v-model="filters.type"
                />
              </div>
            </template>

            <DataTable.Column
              v-for="col of columns"
              :key="col.field"
              :field="col.field"
              :header="col.header"
            >
              <template #body="{ data: rowData }">
                <template v-if="col.type !== 'component'">
                  <div :data-testid="`list-table-block__column__${col.field}__row`">
                    {{ rowData[col.field] }}
                  </div>
                </template>
                <template v-else>
                  <component
                    :is="col.component({ ...rowData[col.field], value: rowData })"
                    :data-testid="`list-table-block__column__${col.field}__row`"
                  />
                </template>
              </template>
            </DataTable.Column>
          </DataTable>

          <DataTable
            v-if="isLoading"
            :data="Array(10)"
            :columns="columns"
            :loading="false"
            :notShowEmptyBlock="true"
            :pt="{
              root: { class: 'border surface-border rounded' },
              header: { class: 'rounded' }
            }"
          >
            <template #header>
              <div class="flex flex-wrap justify-between gap-2 w-full rounded">
                <span class="p-input-icon-left max-sm:w-full">
                  <i class="pi pi-search" />
                  <InputText
                    class="md:w-20rem max-sm:w-full"
                    v-model.trim="filters.textSnippet"
                    @keyup.enter="applyFilter()"
                    placeholder="Search by name or ID"
                  />
                </span>

                <Dropdown
                  appendTo="body"
                  @change="applyFilter"
                  :options="filterType"
                  class="md:w-14rem max-sm:w-full"
                  optionLabel="label"
                  optionValue="value"
                  v-model="filters.type"
                />
              </div>
            </template>

            <DataTable.Column
              v-for="col of columns"
              :key="col.field"
              :field="col.field"
              :header="col.header"
            >
              <template #body>
                <Skeleton />
              </template>
            </DataTable.Column>
          </DataTable>
        </div>
      </div>
    </PrimeDialog>
  </div>
</template>
