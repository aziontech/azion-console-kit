<template>
  <FormHorizontal
    :isDrawer="isDrawer"
    title="Modules"
    description="Activate modules to extend the configuration possibilities of the Application. Some modules require subscription."
    data-testid="form-horizontal-modules"
  >
    <template #inputs>
      <div
        class="flex flex-col gap-2"
        data-testid="form-horizontal-modules-default"
      >
        <FieldGroupSwitch
          label="Default Modules"
          isCard
          :options="defaultModulesSwitchOptions"
          data-testid="form-horizontal-modules-default-switch"
        >
          <template #footer="{ item }">
            <PrimeTag
              v-if="item?.tag"
              :value="item.tag.value"
              :icon="item.tag.icon"
              severity="info"
              class="mt-3"
              data-testid="form-horizontal-modules-default-switch-tag"
            />
          </template>
        </FieldGroupSwitch>
      </div>

      <div
        class="flex flex-col gap-2"
        data-testid="form-horizontal-modules-subscription"
      >
        <span class="text-color text-base font-medium leading-5">Subscription modules</span>
        <PrimeButton
          outlined
          icon="pi pi-shopping-cart"
          class="max-w-[150px]"
          label="Contact sales"
          @click="openContactSales"
          data-testid="form-horizontal-modules-subscription-contact-sales-button"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch'
  import PrimeButton from 'primevue/button'
  import PrimeTag from 'primevue/tag'
  import { contactSalesEdgeApplicationService } from '@/helpers'

  defineProps({
    isDrawer: {
      type: Boolean
    }
  })

  const openContactSales = () => {
    contactSalesEdgeApplicationService()
  }

  const defaultModulesSwitchOptions = [
    {
      title: 'Application Accelerator',
      nameField: 'applicationAcceleratorEnabled',
      subtitle: 'Optimize protocols and manage dynamic content delivery.'
    },
    {
      title: 'Cache',
      nameField: 'edgeCacheEnabled',
      disabled: true,
      subtitle: 'Customize advanced cache settings.',
      tag: {
        value: 'Automatically enabled in all accounts.',
        icon: 'pi pi-lock'
      }
    },
    {
      title: 'Functions',
      nameField: 'edgeFunctionsEnabled',
      subtitle: 'Build ultra-low latency functions that run on the edge.'
    },
    {
      title: 'Image Processor',
      nameField: 'imageProcessorEnabled',
      subtitle: 'Enable dynamic image editing options.'
    }
  ]
</script>
