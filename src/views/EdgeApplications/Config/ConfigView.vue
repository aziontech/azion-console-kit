<template>
  <div class="flex flex-col">
    <section class="flex my-10 m-auto h-full">
      <div class="flex flex-col p-8 self-center border surface-border max-w-3xl gap-4">
        <div class="flex flex-col">
          <span class="text-color text-3xl font-medium">Edge Application Created!</span>
          <p class="font-normal text-base text-color-secondary mt-4">
            Start customizing the application with a quick setup. Once completed, advanced settings
            will become available and can be edited anytime on the Edge Application or Domain page.
          </p>
        </div>
        <Accordion
          :multiple="true"
          class="mt-4"
          expandIcon="pi pi-chevron-down"
          collapseIcon="pi pi-chevron-up"
          v-model:activeIndex="tabOrigin"
          :pt="{
            root: {
              class: 'flex flex-col gap-8'
            }
          }"
        >
          <AccordionTab
            :disabled="hasCreateOrigin"
            :pt="{
              root: { class: 'rounded-md overflow-hidden border-none' },
              content: { class: 'p-0 pt-6 rounded-b-md overflow-hidden' },
              headerAction: { class: hideOriginBorder },
              headerIcon: { class: `${hasCreateOrigin ? 'hidden' : ''}` }
            }"
          >
            <template #header>
              <div
                class="flex w-full items-center"
                data-testid="create-origion-accordion"
              >
                <div class="w-full flex flex-col gap-2">
                  <span class="text-lg">{{ textInfoOrigin.title }}</span>
                  <span class="text-sm text-color-secondary font-normal"
                    >{{ textInfoOrigin.description }}
                  </span>
                </div>
                <PrimeButton
                  v-if="hasCreateOrigin"
                  icon="pi pi-check"
                ></PrimeButton>
              </div>
            </template>
            <OriginEdgeApplcation
              @createdOrigin="handleResponse('origin')"
              :createOriginService="props.originsServices.createOriginService"
            />
          </AccordionTab>
        </Accordion>
        <Accordion
          :multiple="true"
          class="mt-4"
          expandIcon="pi pi-chevron-down"
          collapseIcon="pi pi-chevron-up"
          v-model:activeIndex="tabDomain"
        >
          <AccordionTab
            :disabled="hasBindDomain"
            :pt="{
              content: { class: 'p-0 pt-6 rounded-b-md overflow-hidden' },
              header: { class: ' rounded-md' },
              headerAction: { class: hideDomainBorder },
              headerIcon: { class: `${hasBindDomain ? 'hidden' : ''}` }
            }"
          >
            <template #header>
              <div
                class="flex w-full items-center"
                data-testid="create-domain-accordion"
              >
                <div class="w-full flex flex-col gap-2">
                  <span class="text-lg">{{ textInfoDomain.title }}</span>
                  <span class="text-sm text-color-secondary font-normal"
                    >{{ textInfoDomain.description }}
                  </span>
                </div>
                <PrimeButton
                  v-if="hasBindDomain"
                  icon="pi pi-check"
                ></PrimeButton>
              </div>
            </template>
            <DomainEdgeApplication
              :listEdgeFirewallService="props.domainsService.listEdgeFirewallService"
              :loadEdgeFirewallService="props.domainsService.loadEdgeFirewallService"
              :listDigitalCertificatesService="props.domainsService.listDigitalCertificatesService"
              :loadDigitalCertificatesService="props.domainsService.loadDigitalCertificateService"
              :loadEdgeApplicationsService="props.domainsService.loadEdgeApplicationsService"
              :listEdgeApplicationsService="props.domainsService.listEdgeApplicationsService"
              :createDomainService="props.domainsService.createDomainService"
              @createdDomain="handleResponse('domain')"
            />
          </AccordionTab>
        </Accordion>
        <Accordion
          :multiple="true"
          class="mt-4"
          expandIcon="pi pi-chevron-down"
          collapseIcon="pi pi-chevron-up"
          v-model:activeIndex="tabCache"
        >
          <AccordionTab
            :disabled="hasCreateCache"
            :pt="{
              content: { class: 'p-0 pt-6 rounded-b-md overflow-hidden' },
              header: { class: ' rounded-md' },
              headerAction: { class: hideCacheBorder },
              headerIcon: { class: `${hasCreateCache ? 'hidden' : ''}` }
            }"
          >
            <template #header>
              <div
                class="flex w-full items-center"
                data-testid="create-cache-accordion"
              >
                <div class="w-full flex flex-col gap-2">
                  <span class="text-lg">{{ textInfoCache.title }}</span>
                  <span class="text-sm text-color-secondary font-normal"
                    >{{ textInfoCache.description }}
                  </span>
                </div>
                <PrimeButton
                  v-if="hasCreateCache"
                  icon="pi pi-check"
                ></PrimeButton>
              </div>
            </template>
            <CacheEdgeApplication
              @createdCache="handleResponse('cache')"
              :createCacheSettingsService="props.cacheSettingsServices.createCacheSettingsService"
            />
          </AccordionTab>
        </Accordion>
      </div>
    </section>
    <actionBarSkitConfig
      :finishedConfiguration="finishedConfiguration"
      :primaryActionLabel="primaryActionLabel"
      @onSubmit="onSubmit"
    />
  </div>
</template>
<script setup>
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import OriginEdgeApplcation from './OriginEdgeApplcation.vue'
  import DomainEdgeApplication from './DomainEdgeApplication.vue'
  import CacheEdgeApplication from './CacheEdgeApplication.vue'
  import actionBarSkitConfig from '@/templates/action-bar-block/action-bar-skit-config.vue'
  import PrimeButton from 'primevue/button'
  import { useRoute, useRouter } from 'vue-router'

  import { ref, computed } from 'vue'
  const props = defineProps({
    domainsService: { type: Object, required: true },
    cacheSettingsServices: { type: Object, required: true },
    originsServices: { type: Object, required: true }
  })

  const activeAccordionTab = ref([])
  const hasBindDomain = ref(false)
  const hasCreateOrigin = ref(false)
  const hasCreateCache = ref(false)
  const route = useRoute()
  const router = useRouter()
  const tabOrigin = ref([])
  const tabDomain = ref([])
  const tabCache = ref([])

  const edgeApplicationId = ref(route.params.id)

  const STYLE_HEADER_ACCORDION = 'flex flex-row-reverse p-8 gap-2'
  const STYLE_HEADER_HIDE_BORDER = `${STYLE_HEADER_ACCORDION} border-b-0`

  const hideOriginBorder = computed(() =>
    activeAccordionTab.value.includes(0) ? STYLE_HEADER_HIDE_BORDER : STYLE_HEADER_ACCORDION
  )

  const hideDomainBorder = computed(() =>
    activeAccordionTab.value.includes(1) ? STYLE_HEADER_HIDE_BORDER : STYLE_HEADER_ACCORDION
  )

  const hideCacheBorder = computed(() =>
    activeAccordionTab.value.includes(2) ? STYLE_HEADER_HIDE_BORDER : STYLE_HEADER_ACCORDION
  )

  const textInfoOrigin = computed(() => {
    if (hasCreateOrigin.value) {
      return {
        description:
          'The application will use the origin servers and hosts as configured. To edit these settings, go to the Edge Application page and select the application > Origins.',
        title: 'Default origin defined!'
      }
    }
    return {
      description: 'Customize settings related to origin servers and hosts.',
      title: 'Define a default origin'
    }
  })

  const textInfoDomain = computed(() => {
    if (hasBindDomain.value) {
      return {
        description:
          'The selected domain is now associated with this application. To edit these settings, go to the Domains page and select the domain > Deployment.',
        title: 'Domain associed!'
      }
    }
    return {
      description: 'Create the domain to associate with the edge application.',
      title: 'Associate a domain'
    }
  })

  const textInfoCache = computed(() => {
    if (hasCreateCache.value) {
      return {
        description:
          'The edge will handle TTL values sent by the origin and content cache as set. To edit these settings, go to the Edge Application page and select the application > Cache Settings.',
        title: 'Cache expiration policies set!'
      }
    }
    return {
      description:
        'Define how the edge should handle TTL values sent by the origin as well as how long your content should remain cached at the edge.',
      title: 'Set cache expiration policies'
    }
  })

  const finishedConfiguration = computed(
    () => hasBindDomain.value && hasCreateCache.value && hasCreateOrigin.value
  )
  const primaryActionLabel = computed(() =>
    finishedConfiguration.value ? 'Finish Setup' : 'Skip Configuration'
  )

  const onSubmit = () => {
    router.push({ name: 'edit-edge-application', params: { id: edgeApplicationId.value } })
  }

  const closeAccordionTab = (tab) => {
    tab.value = tab.value.filter((item) => item !== 0)
  }

  const handleResponse = (tab) => {
    if (tab === 'origin') {
      hasCreateOrigin.value = true
      closeAccordionTab(tabOrigin)
    }
    if (tab === 'cache') {
      hasCreateCache.value = true
      closeAccordionTab(tabCache)
    }
    if (tab === 'domain') {
      hasBindDomain.value = true
      closeAccordionTab(tabDomain)
    }
  }
</script>
