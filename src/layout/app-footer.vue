<template>
  <footer class="z-50">
    <Toolbar
      class="gap-6 surface-section border-noround border-x-none w-full m-0 md:px-8 md:py-3 px-3 py-6 z-10 md:flex-row flex-col max-sm:justify-center border-bottom-none"
      :class="toolbarClass"
    >
      <template #start>
        <span
          class="w-full text-center place-items-start md:text-left text-sm text-normal text-color-secondary"
          >© Azion Technologies, Inc or its affiliates. All rights reserved.</span
        >
      </template>

      <template
        #center
        v-if="!route.meta.hideLinksFooter"
      >
        <div
          class="w-full flex flex-col md:flex-row gap-3 xl:justify-center items-center flex-wrap justify-center"
        >
          <div class="flex gap-1">
            <PrimeButton
              size="small"
              label="About"
              link
              @click="openAzionSiteAboutUs"
            />
            <PrimeButton
              size="small"
              label="Blog"
              link
              @click="openAzionBlog"
            />
            <PrimeButton
              size="small"
              label="Legal"
              link
              @click="azionPrivacyPolicyWindowOpener"
            />
            <PrimeButton
              size="small"
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
              aria-label="Visit Azion on GitHub"
              v-tooltip.top="{ value: 'Github', showDelay: 200 }"
              @click="openAzionGithub"
            />
            <PrimeButton
              icon="pi pi-discord"
              outlined
              size="small"
              aria-label="Join Azion Discord community"
              v-tooltip.top="{ value: 'Discord', showDelay: 200 }"
              @click="openAzionDiscord"
            />
            <PrimeButton
              icon="ai ai-x"
              outlined
              size="small"
              aria-label="Follow Azion on X (Twitter)"
              v-tooltip.top="{ value: 'X', showDelay: 200 }"
              @click="openAzionX"
            />
          </div>
        </div>
      </template>

      <template #end>
        <div class="w-full flex flex-wrap gap-2 items-center justify-center">
          <AzionSystemStatus
            v-tooltip.top="{ value: 'System status', showDelay: 200 }"
            v-if="!route.meta.hideLinksFooter"
          />
        </div>
      </template>
    </Toolbar>
  </footer>
</template>

<script setup>
  import {
    azionPrivacyPolicyWindowOpener,
    openAzionBlog,
    openAzionDiscord,
    openAzionGithub,
    openAzionSiteAboutUs,
    openAzionX,
    openDocumentation
  } from '@/helpers'

  import { computed } from 'vue'
  import Toolbar from '@aziontech/webkit/toolbar'
  import AzionSystemStatus from '@aziontech/webkit/azion-system-status'
  import PrimeButton from '@aziontech/webkit/button'
  import { useRoute } from 'vue-router'

  const route = useRoute()

  defineOptions({
    name: 'footer-block'
  })

  const toolbarClass = computed(() => ({
    '!gap-3': route.meta.hideLinksFooter
  }))
</script>
