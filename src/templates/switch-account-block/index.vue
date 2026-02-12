<script setup>
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@/templates/list-table-block/with-lazy-and-dropdown-filter.vue'
  import PrimeButton from 'primevue/button'
  import PrimeCard from 'primevue/card'
  import PrimeDialog from 'primevue/dialog'
  import Divider from 'primevue/divider'
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import Menu from 'primevue/menu'
  import PrimeTag from 'primevue/tag'
  import { computed, ref, watch } from 'vue'

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

  const isLoadingAccount = computed(() => !props.account?.accountTypeIcon)

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
        <ListTableBlock
          :listService="listTypeAccountService"
          :limitShowRows="10"
          pageTitle="Accounts List"
          :columns="columns"
          :headerFilter="filterSwitch"
          @onSelectedRow="onSelectedAccount"
          description="Type the account name to filter results."
          emptyListMessage="No accounts found."
        >
          <template #headerFilters="{ filter, applyFilter }">
            <div class="flex flex-wrap justify-between gap-2 w-full rounded">
              <span class="p-input-icon-left max-sm:w-full">
                <i class="pi pi-search" />
                <InputText
                  class="md:w-20rem max-sm:w-full"
                  v-model.trim="filter.textSnippet"
                  @keyup.enter="applyFilter()"
                  placeholder="Search by name or ID"
                />
              </span>

              <Dropdown
                appendTo="self"
                @change="applyFilter"
                :options="filterType"
                class="md:w-14rem max-sm:w-full"
                optionLabel="label"
                optionValue="value"
                v-model="filter.type"
              />
            </div>
          </template>
        </ListTableBlock>
      </div>
    </PrimeDialog>
  </div>
</template>
