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
            <Tag
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
          kind="outlined"
          size="medium"
          icon="pi pi-shopping-cart"
          label="Contact sales"
          @click="openContactSales"
          data-testid="form-horizontal-modules-subscription-contact-sales-button"
          class="max-w-[170px] whitespace-nowrap"
        />
      </div>
    </template>
  </FormHorizontal>
</template>

<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldGroupSwitch from '@aziontech/webkit/field-group-switch'
  import PrimeButton from '@aziontech/webkit/button'
  import Tag from '@aziontech/webkit/tag'
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
