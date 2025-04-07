<template>
  <PrimeButton
    @click="sidebarToggle"
    @keydown="handleButtonKeyDown"
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
    ref="menuButton"
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
      ref="menuRef"
      :pt="{
        submenuheader: { class: 'text-base font-medium leading-none mt-5 md:px-4' },
        action: { class: 'md:px-4' },
        menu: { class: '' }
      }"
      class="w-full border-none pb-20 px-0 md:px-2 pt-1 md:pt-4 bg-transparent"
      :model="menus"
      @focus="scrollToFocusedItem"
    >
      <template #item="{ item, label, props }">
        <a
          class="flex focus:outline-none"
          v-bind="props.action"
          @click.prevent="redirectToRoute(item)"
          @click.middle="windowOpen(item.to)"
          :href="item.to"
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
  import { ref, computed, nextTick } from 'vue'
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
  const menuButton = ref(null)
  const menuRef = ref(null)

  defineOptions({ name: 'sidebar-block' })

  const router = useRouter()
  const accountStore = useAccountStore()
  const TYPE_CLIENT = 'client'
  const isAccountTypeClient = computed(() => accountStore.account.kind === TYPE_CLIENT)
  const showSidebar = ref(false)

  const scrollToFocusedItem = () => {
    nextTick(() => {
      const sidebarContent = document.querySelector('.p-sidebar-content')
      const focusedItem = document.querySelector('[data-p-focused="true"]')

      if (sidebarContent && focusedItem) {
        const itemTop = focusedItem.offsetTop
        const itemHeight = focusedItem.offsetHeight
        const contentHeight = sidebarContent.offsetHeight
        const scrollTop = sidebarContent.scrollTop
        const padding = 64 // Pequeno padding para garantir visibilidade completa

        if (itemTop < scrollTop + padding) {
          sidebarContent.scrollTop = Math.max(0, itemTop - padding)
        } else if (itemTop + itemHeight > scrollTop + contentHeight - padding) {
          sidebarContent.scrollTop = itemTop + itemHeight - contentHeight + padding
        }
      }
    })
  }

  const setupMenuFocusListener = () => {
    nextTick(() => {
      const menuList = document.querySelector('[data-pc-section="menu"]')
      if (menuList) {
        menuList.addEventListener('keydown', (event) => {
          if (['ArrowUp', 'ArrowDown'].includes(event.key)) {
            setTimeout(() => {
              scrollToFocusedItem()
            }, 0)
          }
        })
      }
    })
  }

  const handleButtonKeyDown = async (event) => {
    if (event.key === 'ArrowDown' && showSidebar.value) {
      event.preventDefault()
      await nextTick()
      const menuList = document.querySelector('[data-pc-section="menu"]')
      if (menuList) {
        menuList.focus()
        const firstMenuItem = menuList.querySelector('[data-pc-section="menuitem"]')
        if (firstMenuItem) {
          firstMenuItem.focus()
          setupMenuFocusListener()
        }
      }
    }
  }

  const sidebarToggle = () => {
    showSidebar.value = !showSidebar.value
    if (showSidebar.value) {
      menuButton.value.$el.focus()
    }
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
