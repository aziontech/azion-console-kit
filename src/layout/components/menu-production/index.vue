<template>
  <PrimeButton
    @click="sidebarToggle"
    v-if="isAccountTypeClient"
    size="small"
    class="text-white flex-none border-header w-8 h-8"
    icon="pi pi-bars"
    :pt="{
      label: { class: 'text-white hover:bg-header-button-hover' },
      icon: { class: 'text-white' }
    }"
    :class="{
      'bg-header-button-enabled': showSidebar,
      'bg-header hover:bg-header-button-hover': !showSidebar
    }"
    v-tooltip.bottom="{ value: 'Menu', showDelay: 200 }"
    data-testid="sidebar-block__toggle-button"
  />

  <Sidebar
    :pt="{
      header: { class: 'hidden' },
      root: { class: 'shadow-none' },
      mask: { class: 'top-14' },
      content: { class: 'px-0 md:px-4 pt-0' }
    }"
    class="z-5"
    style="border-right: 1px solid var(--surface-border)"
    position="left"
    v-model:visible="showSidebar"
  >
    <PrimeMenu
      :pt="{
        submenuheader: { class: 'text-base font-medium leading-none mt-5 md:px-4' },
        action: { class: 'md:px-4' }
      }"
      class="w-full border-none pb-20 px-0 md:px-2 pt-1 md:pt-4 bg-transparent"
      :model="menus"
    >
      <template #item="{ item, label, props }">
        <a
          class="flex h-9"
          v-bind="props.action"
          @click="redirectToRoute(item)"
          @click.middle="windowOpen(item.to)"
          :data-testid="`sidebar-block__menu-item__${item.id}`"
          v-if="item?.clientFlag ? checkFlag(item?.clientFlag) : true"
        >
          <span v-bind="props.icon" />
          <span v-bind="props.label">{{ label }}</span>
          <PrimeTag
            v-if="item.tag"
            :value="item.tag"
            class="ml-2"
          />
        </a>
      </template>
    </PrimeMenu>
  </Sidebar>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import PrimeTag from 'primevue/tag'
  import { useAccountStore } from '@/stores/account'
  import PrimeButton from 'primevue/button'
  import PrimeMenu from 'primevue/menu'
  import Sidebar from 'primevue/sidebar'
  import { listSidebarMenusService } from '@services/sidebar-menus-services'
  import { windowOpen } from '@/helpers/window-open'
  import { useMagicKeys } from '@vueuse/core'

  const { meta, control } = useMagicKeys()

  defineOptions({ name: 'sidebar-block' })

  const router = useRouter()
  const accountStore = useAccountStore()
  const TYPE_CLIENT = 'client'
  const isAccountTypeClient = computed(() => accountStore.account.kind === TYPE_CLIENT)
  const showSidebar = ref(false)

  const sidebarToggle = () => {
    showSidebar.value = !showSidebar.value
  }

  const redirectToRoute = (item) => {
    const { to: route, external = false } = item
    sidebarToggle()

    const shouldOpenInNewWindow = meta.value || control.value || external
    if (shouldOpenInNewWindow) {
      windowOpen(route)
    } else {
      router.push(route)
    }
  }

  const checkFlag = (flag) => accountStore.account.client_flags.includes(flag)

  const showMarketplaceProductsInMenu = computed(() => accountStore.hasAccessToMarketplaceProducts)

  const menus = computed(() => {
    const response = listSidebarMenusService(showMarketplaceProductsInMenu.value)

    return response.body.menus
  })
</script>
