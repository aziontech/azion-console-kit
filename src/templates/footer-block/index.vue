<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <!-- Footer -->
  <footer
    class="z-10 flex px-3 py-6 flex-wrap flex-col justify-center items-center gap-3 lg:gap-4 surface-ground border-t surface-border lg:flex-row pr-3 lg:py-3 lg:px-8 lg:justify-center"
  >
    <span class="text-sm text-normal text-color">© 2024 Azion Technologies.</span>

    <div
      class="flex flex-col gap-3 lg:gap-4 items-center lg:flex lg:flex-row flex-none md-auto md:flex-1"
    >
      <div class="w-full flex flex-col md:flex-row gap-3 justify-center items-center">
        <div class="flex gap-1 lg:pl-[16%] pl-0">
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
            text
            size="small"
            v-tooltip.top="{ value: 'Github', showDelay: 200 }"
            @click="openGitHub"
          />
          <PrimeButton
            icon="pi pi-discord"
            text
            size="small"
            v-tooltip.top="{ value: 'Discord', showDelay: 200 }"
            @click="openDiscord"
          />
          <PrimeButton
            icon="ai ai-twitter"
            text
            size="small"
            v-tooltip.top="{ value: 'Twitter', showDelay: 200 }"
            @click="openX"
          />
          <!--Change Twitter icon to X-->
        </div>
      </div>
      <div class="flex gap-2 items-center">
        <!-- System Status -->
        <SystemStatusBarBlock v-tooltip.top="{ value: 'System status', showDelay: 200 }" />
        <div v-tooltip.top="{ value: 'Theme mode', showDelay: 200 }">
          <Dropdown
            :modelValue="selectedTheme"
            @update:modelValue="selectTheme"
            optionValue="value"
            optionLabel="name"
            :loading="!selectedTheme?.value"
            :options="themeOptions"
            :autoOptionFocus="false"
            :pt="{
              root: {
                class: 'w-[7.4rem]',
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
    </div>
  </footer>
</template>

<script>
  import Dropdown from 'primevue/dropdown'
  import PrimeButton from 'primevue/button'
  import SystemStatusBarBlock from '@templates/system-status-bar-block'
  import { useAccountStore } from '@/stores/account'
  import { mapActions, mapState } from 'pinia'

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
        window.open('https://twitter.com/aziontech', '_blank')
      }
    }
  }
</script>
