<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <!-- Footer -->
  <footer
    class="z-10 w-full px-3 md:px-8 py-6 md:py-3 border-t m-0 surface-border gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:lg:grid-cols-3 place-items-stretch items-center"
  >
    <span
      class="w-full text-center truncate place-items-start md:text-left text-sm text-normal text-color-secondary"
      >© Azion Technologies, Inc or its affiliates. All rights reserved.</span
    >
    <div class="w-full flex flex-col md:flex-row gap-3 justify-end xl:justify-center items-center">
      <div class="flex gap-1">
        <PrimeButton
          label="About"
          link
          @click="openAbout"
        />
        <PrimeButton
          label="Blog"
          link
          @click="openBlog"
        />
        <PrimeButton
          label="Legal"
          link
          @click="openLegal"
        />
        <PrimeButton
          label="Docs"
          link
          @click="openDocs"
        />
      </div>
      <!-- Social Buttons -->
      <div class="flex gap-2">
        <PrimeButton
          icon="pi pi-github"
          outlined
          size="small"
          v-tooltip.top="{ value: 'Github', showDelay: 200 }"
          @click="openGitHub"
        />
        <PrimeButton
          icon="pi pi-discord"
          outlined
          size="small"
          v-tooltip.top="{ value: 'Discord', showDelay: 200 }"
          @click="openDiscord"
        />
        <PrimeButton
          icon="ai ai-x"
          outlined
          size="small"
          v-tooltip.top="{ value: 'X', showDelay: 200 }"
          @click="openX"
        />
      </div>
    </div>
    <div
      class="w-full flex flex-wrap gap-2 items-center justify-center md:justify-start xl:justify-end"
    >
      <!-- System Status -->
      <SystemStatusBarBlock v-tooltip.top="{ value: 'System status', showDelay: 200 }" />
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

<script>
  import { useAccountStore } from '@/stores/account'
  import SystemStatusBarBlock from '@templates/system-status-bar-block'
  import { mapActions, mapState } from 'pinia'
  import PrimeButton from 'primevue/button'
  import Dropdown from 'primevue/dropdown'

  export default {
    name: 'FooterTemplate',
    components: {
      PrimeButton,
      Dropdown,
      SystemStatusBarBlock
    },
    data() {
      return {
        themeOptions: [
          { name: 'Light', value: 'light', icon: 'pi pi-sun' },
          { name: 'Dark', value: 'dark', icon: 'pi pi-moon' },
          { name: 'System', value: 'system', icon: 'pi pi-desktop' }
        ]
      }
    },
    computed: {
      ...mapState(useAccountStore, ['currentTheme']),
      selectedTheme() {
        return this.themeOptions.find((option) => option.value === this.currentTheme)
      }
    },
    methods: {
      ...mapActions(useAccountStore, ['setTheme']),
      selectTheme(theme) {
        this.setTheme(theme)
      },
      openAbout() {
        window.open('https://www.azion.com/', '_blank')
      },
      openBlog() {
        window.open('https://www.azion.com/en/blog/', '_blank')
      },
      openLegal() {
        window.open('https://www.azion.com/en/documentation/agreements/privacy-policy/', '_blank')
      },
      openDocs() {
        window.open('https://www.azion.com/en/documentation/', '_blank')
      },
      openDiscord() {
        window.open('https://discord.com/invite/Yp9N7RMVZy', '_blank')
      },
      openGitHub() {
        window.open('https://github.com/aziontech/azion-platform-kit', '_blank')
      },
      openX() {
        window.open('https://x.com/aziontech', '_blank')
      }
    }
  }
</script>
