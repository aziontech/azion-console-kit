<template>
  <div>
    <Accordion :activeIndex="0">
      <AccordionTab
        header="Regex examples:"
        :pt="{ headerTitle: { class: 'text-sm' } }"
      >
        <div class="flex flex-col gap-3">
          <div
            class="flex items-center gap-1"
            v-for="value in regexExamples"
            :key="value.title"
          >
            <p class="text-xs font-normal text-color-secondary w-full max-w-[125px]">
              {{ value.title }}
            </p>
            <span class="code-log-body text-xs font-normal">{{ value.regex }}</span>
          </div>
        </div>
      </AccordionTab>
    </Accordion>
    <PrimeButton
      link
      icon="pi pi-external-link"
      icon-pos="right"
      label="View more in Docs"
      class="w-fit p-0 text-xs"
      @click="clickOnLearnMore"
    />
  </div>
</template>

<script setup>
  import PrimeButton from 'primevue/button'
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'

  const regexExamples = [
    {
      title: 'Access to endpoint:',
      regex: '^/healthcheck$'
    },
    {
      title: 'Numeric ID:',
      regex: '^/user/[0-9]{1,9}$'
    },
    {
      title: 'ID + Subpath:',
      regex: '^/order/[0-9]{1,9}(/.*)?$'
    },
    {
      title: 'API versions:',
      regex: '^/api/v[0-9]+(/[A-Za-z0-9_-]+)*$'
    },
    {
      title: 'Parameters in Order:',
      // eslint-disable-next-line no-useless-escape
      regex: '^/checkout\?cart_id=[0-9]+&token=[A-Za-z0-9]+$'
    }
  ]

  const clickOnLearnMore = () => {
    window.open(
      'https://www.azion.com/en/documentation/products/edge-firewall/allowed-rules/',
      '_blank'
    )
  }
</script>
