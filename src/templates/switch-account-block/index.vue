<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <PrimeButton
      class="font-semibold ml-2 h-8 w-auto hidden border-header md:flex items-center text-white"
      :label="account.name"
      size="small"
      :icon="ICON_TYPE_ACCOUNT[account.kind]"
      :loading="!account?.name"
      outlined
      v-tooltip.bottom="{ value: 'Switch account', showDelay: 200 }"
      @click="visible = true"
    />
    <PrimeDialog
      :blockScroll="true"
      v-model:visible="visible"
      @update:visible="visibleDialog"
      modal
      :breakpoints="{ '641px': '90vw' }"
      :pt="{
        root: { class: 'p-0 w-[880px] h-[632px]' },
        header: { class: 'px-8 py-3 gap-3' },
        content: { class: 'p-0 h-full' }
      }"
    >
      <template #header>
        <h4 class="w-full text-xl not-italic font-medium leading-7">Switch Account</h4>
      </template>
      <div class="p-8 flex flex-col gap-8">
        <PrimeCard
          class="w-fit"
          :pt="{
            content: {
              class: 'p-4 rounded-md gap-4 border-solid flex flex justify-between sm:p-3'
            }
          }"
        >
          <template #content>
            <div
              class="flex gap-4 items-center justify-center max-sm:gap-3 max-sm:flex-col max-sm:items-start"
            >
              <div class="flex justify-between items-center self-stretch">
                <h3 class="text-color text-center text-lg not-italic font-medium leading-7">
                  {{ account.name }}
                </h3>
                <PrimeButton
                  icon="pi pi-cog"
                  type="button"
                  outlined
                  class="hidden max-sm:block"
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

              <div class="flex items-center gap-1">
                <span class="font-medium text-sm">ID</span>
                <span class="font=normal text-sm">{{ account.id }}</span>
              </div>
              <div class="flex items-center gap-2">
                <PrimeTag
                  :value="NAME_TYPE_ACCOUNT[account.kind]"
                  :icon="ICON_TYPE_ACCOUNT[account.kind]"
                />
                <PrimeTag
                  value="Current Logged"
                  icon="pi pi-check-circle"
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
              ref="menu"
              id="overlay_menu"
              :model="items"
              @toggle="visible = false"
              :popup="true"
            />
          </template>
        </PrimeCard>
        <ListTableBlock
          :listService="listTypeAccountService"
          :limitShowRows="5"
          pageTitle="Accounts List"
          :columns="columns"
          :headerFilter="filterSwitch"
          description="Type your account name to filter results."
        >
          <template #headerFilters="{ filter, applyFilter }">
            <div class="flex flex-wrap justify-between gap-2 w-full rounded">
              <span class="p-input-icon-left max-sm:w-full">
                <i class="pi pi-search" />
                <InputText
                  class="md:w-[340px] max-sm:w-full"
                  v-model="filter.textSnippet"
                  @keyup.enter="applyFilter()"
                  placeholder="Search"
                />
              </span>

              <Dropdown
                @change="applyFilter"
                :options="filterType"
                class="md:w-[216px] max-sm:w-full"
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

<script>
  export default {
    name: 'SwitchAccountBlock'
  }
</script>
<script setup>
  import { ref, watch } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import PrimeTag from 'primevue/tag'
  import PrimeButton from 'primevue/button'
  import Menu from 'primevue/menu'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'
  import PrimeCard from 'primevue/card'
  import ListTableBlock from '@/templates/list-table-block/with-lazy-and-dropdown-filter.vue'
  import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
  import { switchAccountService } from '@/services/auth-services'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

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
    }
  })

  const visible = ref(false)

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

  const filterSwitch = ref({
    textSnippet: '',
    type: 'brands'
  })

  const accountStore = useAccountStore()
  const { account } = storeToRefs(accountStore)

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
          columnAppearance: 'clickable-tag',
          dependencies: {
            clickAction: onSelectedAccount,
            clickProps: columnData.value
          }
        })
    },
    {
      field: 'id',
      header: 'ID',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'clickable-text',
          dependencies: {
            clickAction: onSelectedAccount,
            clickProps: columnData.value
          }
        })
    },
    {
      field: 'client_id',
      header: 'Client ID',
      type: 'component',
      component: (columnData) =>
        columnBuilder({
          data: columnData,
          columnAppearance: 'clickable-text',
          dependencies: {
            clickAction: onSelectedAccount,
            clickProps: columnData.value
          }
        })
    }
  ])

  const ICON_TYPE_ACCOUNT = {
    client: 'pi pi-box',
    reseller: 'pi pi-folder',
    company: 'pi pi-building',
    brand: 'pi pi-globe'
  }

  const NAME_TYPE_ACCOUNT = {
    client: 'Client',
    reseller: 'Group',
    company: 'Reseller',
    brand: 'Brand'
  }

  const adapterAccessMenu = props.accessMenu.slice(0, -1).reduce((result, item) => {
    if (item.label !== 'Switch Account') {
      result.push({
        ...item,
        command: () => {
          visible.value = false
        }
      })
    }
    return result
  }, [])

  const items = ref(adapterAccessMenu)

  const menu = ref()

  const toggle = (event) => {
    menu.value.toggle(event)
  }

  const onSelectedAccount = async (rowSelected) => {
    const { first_login: firstLogin } = await switchAccountService(rowSelected.accountId)
    visible.value = false
    if (firstLogin) {
      window.location = 'iam/additional-data'
      return
    }
    window.location.replace('/')
  }
</script>
