<template>
  <div
    class="top-0 p-input-icon-left p-input-icon-right hidden md:flex md:my-3"
  >
    <i class="pi pi-search text-white" />
    <i class="!top-[32%]">
      <span
        @click="openSearch"
        class="rounded-md py-1 px-2 text-xs font-semibold bg-header not-italic border border-header text-header cursor-pointer"
      >
        ⌘ K
      </span>
    </i>
    <InputText
      class="w-64 bg-header-input border-header placeholder:text-header text-header hover:border-header-hover"
      placeholder="Search"
      :value="search"
      @click="openSearch"
      size="small"
    />
  </div>

  <PrimeButton
    icon="pi pi-search"
    class="bg-header hover:bg-header-button-hover !text-white px-2 py-1 flex border-header h-8 w-8 md:hidden"
    :pt="{
      label: { class: 'text-white' },
      icon: { class: 'text-white' }
    }"
    @click="openSearch"
    v-tooltip.bottom="{ value: 'Search', showDelay: 200 }"
  />

  <PrimeDialog
    v-model:visible="showSearch"
    modal
    position="center"
    :dismissableMask="true"
    :showHeader="false"
    :breakpoints="{ '641px': '90vw' }"
    :style="{ marginTop: '0px', width: '540px', maxHeight: '21rem' }"
    :pt="{
      root: { class: 'p-0 rounded-md' },
      content: { class: 'p-0 rounded-md' }
    }"
  >
    <div class="flex flex-col">
      <span class="sticky top-0 z-10 p-input-icon-left p-input-icon-right border-b surface-border">
        <i class="pi pi-search" />
        <i class="!top-[35%]">
          <Tag
            severity="info"
            @click="closeSearch"
            class="not-italic border surface-border text-color-secondary surface-100 cursor-pointer"
            value="ESC"
          />
        </i>
        <InputText
          placeholder="Search..."
          id="search"
          class="w-full rounded-none border-none h-12"
        />
      </span>
      <div class="m-2 surface-border border border-dashed flex items-center h-96">
        <p class="text-color-secondary text-center w-full">Slot</p>
      </div>
    </div>
  </PrimeDialog>
</template>

<script setup>
import { ref } from 'vue'

import Tag from 'primevue/tag'
import InputText from 'primevue/inputtext'
import PrimeDialog from 'primevue/dialog'
import PrimeButton from 'primevue/button'

defineOptions({ name: 'search-block' })

const search = ref('')
const showSearch = ref(false)

const openSearch = () => {
  showSearch.value = true
}

const listenerKeyDown = () => {
  document.addEventListener('keydown', (event) => {
    const isCommandKeyPressed = event.metaKey || event.ctrlKey
    const isKKeyPressed = event.key === 'k' || event.key === 'K'
  
    if (isCommandKeyPressed && isKKeyPressed) {
      showSearch.value = true
    }
  })
}

listenerKeyDown()
</script>
