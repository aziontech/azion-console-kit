<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <div>
    <PrimeButton
      class="font-semibold ml-2 h-8 w-auto surface-border hidden md:flex items-center"
      :label="account.name"
      size="small"
      :icon="ICON_TYPE_ACCOUNT[account.kind]"
      :loading="!account?.name"
      outlined
      v-tooltip.bottom="'Switch Account'"
      @click="visible = true"
    />
    <PrimeDialog
      :blockScroll="true"
      v-model:visible="visible"
      modal
      :breakpoints="{ '641px': '90vw' }"
      :pt="{
        root: { class: 'p-0 w-[880px] h-[632px]' },
        header: { class: 'px-8 py-3 gap-3' },
        content: { class: 'p-0 h-full' }
      }"
    >
      <template #header>
        <h4 class="text-xl font-bold leading-[normal] w-full">Switch Account</h4>
      </template>
      <div class="p-8 flex flex-col gap-8">
        <PrimeCard
          class="w-fit"
          :pt="{
            content: { class: 'p-4 rounded-md border-solid flex flex justify-between gap-4' }
          }"
        >
          <template #content>
            <div class="flex gap-4 items-center">
              <h3 class="text-color text-center text-lg not-italic font-medium leading-7">
                {{ account.name }}
              </h3>
              <Divider layout="vertical" />
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
              text
              type="button"
              raised
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
          :limitShowRows="10"
          @selected-account="onSelectedAccount"
          pageTitle="Accounts List"
          description="Type your account name to filter results."
        />
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
  import { ref } from 'vue'
  import PrimeDialog from 'primevue/dialog'
  import PrimeTag from 'primevue/tag'
  import PrimeButton from 'primevue/button'
  import Menu from 'primevue/menu'
  import Divider from 'primevue/divider'
  import PrimeCard from 'primevue/card'
  import ListTableBlock from '@/templates/list-table-block/with-dropdown.vue'
  import { listTypeAccountService } from '@/services/switch-account-services/list-type-account-service'
  import { switchAccountService } from '@/services/auth-services'
  import { useAccountStore } from '@/stores/account'
  import { storeToRefs } from 'pinia'
  import { useRouter } from 'vue-router'

  const props = defineProps({
    accessMenu: {
      type: Array,
      required: true
    }
  })
  const router = useRouter()
  const accountStore = useAccountStore()
  const { account } = storeToRefs(accountStore)

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

  const adapterAccessMenu = props.accessMenu.map((item) => {
    return {
      ...item,
      command: () => {
        visible.value = false
      }
    }
  })
  adapterAccessMenu.pop()

  const items = ref(adapterAccessMenu)
  const visible = ref(false)
  const menu = ref()

  const toggle = (event) => {
    menu.value.toggle(event)
  }

  const onSelectedAccount = async (account) => {
    await switchAccountService(account.id)
    visible.value = false
    router.push({ name: 'home' })
  }
</script>
