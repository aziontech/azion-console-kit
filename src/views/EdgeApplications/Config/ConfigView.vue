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
          :activeIndex="0"
          :pt="{
            root: {
              class: 'flex flex-col gap-8'
            }
          }"
        >
          <AccordionTab
            :pt="{
              content: { class: 'p-0' },
              headerAction: { class: 'flex flex-row-reverse' }
            }"
          >
            <template #header>
              <div class="w-full flex flex-col gap-2 ml-4">
                <span> Define a default origin</span>
                <span class="text-sm text-color-secondary"
                  >Customize settings related to origin servers and hosts.
                </span>
              </div>
            </template>
            <OriginEdgeApplcation></OriginEdgeApplcation>
          </AccordionTab>
          <AccordionTab
            :pt="{
              content: { class: 'p-0' },
              header: { class: 'border-t surface-border rounded-md' },
              headerAction: { class: 'flex flex-row-reverse' }
            }"
          >
            <template #header>
              <div class="w-full flex flex-col gap-2 ml-4">
                <span>Associate a domain</span>
                <span class="text-sm text-color-secondary"
                  >Select the domain to associate with the edge application.</span
                >
              </div>
            </template>
            <DomainEdgeApplication
              :listDomainsService="props.domainsService.listDomainsService"
              :loadDOmainsService="props.domainsService.loadDOmainsService"
            />
          </AccordionTab>
          <AccordionTab
            :pt="{
              content: { class: 'p-0' },
              header: { class: 'border surface-border rounded-md' },
              headerAction: { class: 'flex flex-row-reverse border-none' }
            }"
          >
            <template #header>
              <div class="w-full flex flex-col gap-2 ml-4">
                <span>Set cache expiration policies</span>
                <span class="text-sm text-color-secondary"
                  >Define how the edge should handle TTL values sent by the origin as well as how
                  long your content should remain cached at the edge.</span
                >
              </div>
            </template>
            <CacheEdgeApplication />
          </AccordionTab>
        </Accordion>
      </div>
    </section>
    <actionBarSkitConfig />
  </div>
</template>
<script setup>
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import OriginEdgeApplcation from './OriginEdgeApplcation.vue'
  import DomainEdgeApplication from './DomainEdgeApplication.vue'
  import CacheEdgeApplication from './CacheEdgeApplication.vue'
  import actionBarSkitConfig from '@/templates/action-bar-block/action-bar-skit-config.vue'
  const props = defineProps({
    domainsService: { type: Object, required: true }
  })
</script>
