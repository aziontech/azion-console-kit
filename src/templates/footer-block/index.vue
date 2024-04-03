<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <!-- Footer -->
  <footer
    class="z-10 w-full px-3 md:px-8 py-6 md:py-3 border-t m-0 surface-section surface-border gap-6 place-items-stretch items-center"
    :class="dynamicClassesByRouteMeta.footer"
  >
    <span
      class="w-full text-center truncate place-items-start md:text-left text-sm text-normal text-color-secondary"
      >© Azion Technologies, Inc or its affiliates. All rights reserved.</span
    >
    <div
      class="w-full flex flex-col md:flex-row gap-3 justify-end xl:justify-center items-center"
      v-if="!route.meta.hideLinksFooter"
    >
      <div class="flex gap-1">
        <PrimeButton
          label="About"
          link
          @click="openAzionSite"
        />
        <PrimeButton
          label="Blog"
          link
          @click="openAzionBlog"
        />
        <PrimeButton
          label="Legal"
          link
          @click="azionPrivacyPolicyWindowOpener"
        />
        <PrimeButton
          label="Docs"
          link
          @click="openDocumentation"
        />
      </div>
      <!-- Social Buttons -->
      <div class="flex gap-2">
        <PrimeButton
          icon="pi pi-github"
          outlined
          size="small"
          v-tooltip.top="{ value: 'Github', showDelay: 200 }"
          @click="openAzionGithub"
        />
        <PrimeButton
          icon="pi pi-discord"
          outlined
          size="small"
          v-tooltip.top="{ value: 'Discord', showDelay: 200 }"
          @click="openAzionDiscord"
        />
        <PrimeButton
          icon="ai ai-x"
          outlined
          size="small"
          v-tooltip.top="{ value: 'X', showDelay: 200 }"
          @click="openAzionX"
        />
      </div>
    </div>
    <div
      class="w-full flex flex-wrap gap-2 items-center"
      :class="dynamicClassesByRouteMeta.optionButton"
    >
      <!-- System Status -->
      <SystemStatusBarBlock
        v-tooltip.top="{ value: 'System status', showDelay: 200 }"
        v-if="!route.meta.hideLinksFooter"
      />
      <div v-tooltip.top="{ value: 'Theme mode', showDelay: 200 }">
        <Dropdown
          appendTo="self"
          :modelValue="selectedTheme"
          @update:modelValue="selectTheme"
          optionValue="value"
          optionLabel="name"
          :loading="!selectedTheme?.value"
          :options="themeOptions"
          :autoOptionFocus="false"
          :pt="{
            root: {
              class: 'w-32',
              style: 'background: var(--surface-section) !important'
            },
            item: { class: 'w-full text-sm' },
            input: { class: 'w-auto text-sm' }
          }"
        >
          <template #value="slotProps">
            <div
              v-if="slotProps.value"
              class="flex gap-2 align-items-center"
            >
              <i :class="slotProps.value.icon"></i>
              <div>{{ slotProps.value.name }}</div>
            </div>
          </template>
          <template #option="slotProps">
            <div class="flex gap-2 align-items-center">
              <i :class="slotProps.option.icon"></i>
              <div>{{ slotProps.option.name }}</div>
            </div>
          </template>
        </Dropdown>
      </div>
    </div>
  </footer>
</template>

<script setup>
  import {
    azionPrivacyPolicyWindowOpener,
    openAzionBlog,
    openAzionDiscord,
    openAzionGithub,
    openAzionSite,
    openAzionX,
    openDocumentation
  } from '@/helpers'

  import { ref, computed } from 'vue'
  import { useAccountStore } from '@/stores/account'
  import SystemStatusBarBlock from '@templates/system-status-bar-block'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import { useRoute } from 'vue-router'
  const accountStore = useAccountStore()
  const { setTheme } = accountStore
  const route = useRoute()

  defineOptions({
    name: 'footer-block'
  })

  const themeOptions = ref([
    { name: 'Light', value: 'light', icon: 'pi pi-sun' },
    { name: 'Dark', value: 'dark', icon: 'pi pi-moon' },
    { name: 'System', value: 'system', icon: 'pi pi-desktop' }
  ])

  const currentTheme = computed(() => accountStore.currentTheme)
  const selectedTheme = computed(() =>
    themeOptions.value.find((option) => option.value === currentTheme.value)
  )

  const dynamicClassesByRouteMeta = computed(() => ({
    footer: route.meta.hideLinksFooter
      ? 'flex max-md:flex-col'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:lg:grid-cols-3',
    optionButton: route.meta.hideLinksFooter
      ? 'md:justify-end justify-center'
      : 'justify-center md:justify-start xl:justify-end'
  }))

  const selectTheme = (theme) => {
    setTheme(theme)
  }
</script>
