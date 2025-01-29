<template>
  <div class="flex flex-col">
    <section class="flex my-10 m-auto h-full">
      <div class="flex flex-col p-8 self-center border surface-border max-w-3xl gap-4">
        <div class="flex flex-col">
          <span class="text-color text-4xl">Edge Application Created!</span>
          <p class="font-normal text-lg text-color-secondary mt-4">
            Start customizing the application with a quick setup. Once completed, advanced settings
            will become available and can be edited anytime on the Edge Application or Domain page.
          </p>
        </div>
        <Accordion
          :multiple="true"
          class="mt-4"
          v-model:activeIndex="activeAccordionTab"
          :pt="{
            root: {
              class: 'flex flex-col gap-8'
            }
          }"
        >
          <AccordionTab
            :disabled="hasCreateOrigin"
            :pt="{
              content: { class: 'p-0 pt-2' },
              headerAction: { class: hideOriginBorder },
              headerIcon: { class: `${hasCreateOrigin ? 'hidden' : ''}` }
            }"
          >
            <template #header>
              <div class="flex w-full items-center">
                <div class="w-full flex flex-col gap-2">
                  <span>{{ textInfoOrigin.title }}</span>
                  <span class="text-sm text-color-secondary"
                    >{{ textInfoOrigin.description }}
                  </span>
                </div>
                <PrimeButton
                  v-if="hasCreateOrigin"
                  icon="pi pi-check"
                ></PrimeButton>
              </div>
            </template>
            <OriginEdgeApplcation></OriginEdgeApplcation>
          </AccordionTab>
          <AccordionTab
            :disabled="hasBindDomain"
            :pt="{
              content: { class: 'p-0 pt-2' },
              header: { class: 'border-t surface-border rounded-md' },
              headerAction: { class: hideDomainBorder },
              headerIcon: { class: `${hasBindDomain ? 'hidden' : ''}` }
            }"
          >
            <template #header>
              <div class="flex w-full items-center">
                <div class="w-full flex flex-col gap-2">
                  <span>{{ textInfoDomain.title }}</span>
                  <span class="text-sm text-color-secondary"
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
              :listDomainsService="props.domainsService.listDomainsService"
              :loadDOmainsService="props.domainsService.loadDOmainsService"
            />
          </AccordionTab>
          <AccordionTab
            :disabled="hasCreateCache"
            :pt="{
              content: { class: 'p-0 pt-2' },
              header: { class: 'border-t surface-border rounded-md' },
              headerAction: { class: hideCacheBorder },
              headerIcon: { class: `${hasCreateCache ? 'hidden' : ''}` }
            }"
          >
            <template #header>
              <div class="flex w-full items-center">
                <div class="w-full flex flex-col gap-2">
                  <span>{{ textInfoCache.title }}</span>
                  <span class="text-sm text-color-secondary">{{ textInfoCache.description }} </span>
                </div>
                <PrimeButton
                  v-if="hasCreateCache"
                  icon="pi pi-check"
                ></PrimeButton>
              </div>
            </template>
            <CacheEdgeApplication />
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
    domainsService: { type: Object, required: true }
  })

  const activeAccordionTab = ref([])
  const hasBindDomain = ref(true)
  const hasCreateOrigin = ref(true)
  const hasCreateCache = ref(true)
  const route = useRoute()
  const router = useRouter()

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
    if (hasCreateOrigin.value) {
      return {
        description:
          'The selected domain is now associated with this application. To edit these settings, go to the Domains page and select the domain > Deployment.',
        title: 'Domain associed!'
      }
    }
    return {
      description: 'Select the domain to associate with the edge application.',
      title: 'Associate a domain'
    }
  })

  const textInfoCache = computed(() => {
    if (hasCreateOrigin.value) {
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
    router.push({ name: 'edit-edge-application', params: { id: edgeApplicationId } })
  }
</script>
