<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import PrimeButton from 'primevue/button'
  import PrimeTag from 'primevue/tag'

  import { useField } from 'vee-validate'

  const props = defineProps({
    handleBlock: {
      type: Array,
      required: false,
      default: () => ['full']
    },
    isDrawer: {
      type: Boolean
    },
    contactSalesEdgeApplicationService: {
      type: Function,
      required: true
    }
  })

  const { value: name } = useField('name')

  const defaultModulesSwitchOptions = [
    {
      title: 'Application Accelerator',
      nameField: 'applicationAcceleratorEnabled',
      subtitle: 'Optimize protocols and manage dynamic content delivery.'
    },
    {
      title: 'Edge Cache',
      nameField: 'edgeCacheEnabled',
      disabled: true,
      subtitle: 'Customize advanced cache settings.',
      tag: {
        value: 'Automatically enabled in all accounts.',
        icon: 'pi pi-lock'
      }
    },
    {
      title: 'Edge Functions',
      nameField: 'edgeFunctionsEnabled',
      subtitle: 'Build ultra-low latency functions that run on the edge.'
    },
    {
      title: 'Image Processor',
      nameField: 'imageProcessorEnabled',
      subtitle: 'Enable dynamic image editing options.'
    }
  ]

  const subscriptionModulesSwitchOptions = [
    {
      title: 'Tiered Cache',
      nameField: 'tieredCacheEnabled',
      subtitle: 'Enable an additional cache layer at the edge.'
    }
  ]
</script>

<template>
  <FormHorizontal
    title="General"
    :isDrawer="isDrawer"
    description="Create an edge application to deliver your content from the edge."
    data-testid="form-horizontal-general"
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          placeholder="My edge application"
          :value="name"
          description="Give a unique and descriptive name to identify the edge application."
          data-testid="form-horizontal-general-name"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    :isDrawer="isDrawer"
    title="Modules"
    description="Activate modules to extend the configuration possibilities of the application. Some modules require subscription."
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
        <FieldGroupSwitch
          label="Subscription modules"
          isCard
          :options="subscriptionModulesSwitchOptions"
          data-testid="form-horizontal-modules-subscription-switch"
        />
        <PrimeButton
          outlined
          icon="pi pi-shopping-cart"
          class="max-w-[150px]"
          label="Contact sales"
          @click="props.contactSalesEdgeApplicationService()"
          data-testid="form-horizontal-modules-subscription-contact-sales-button"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Debug Rules"
    :isDrawer="isDrawer"
    description="Log executed rules created in Rules Engine. Query logs using Data Stream, Real-Time Events, or Real-Time Events GraphQL API."
    data-testid="form-horizontal-debug-rules"
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldSwitchBlock
          nameField="debug"
          name="debug"
          auto
          :isCard="false"
          title="Active"
          subtitle="Rules that were successfully executed will be shown under the $traceback field in Data
              Streaming and Real-Time Events or the $stacktrace variable in GraphQL."
          data-testid="form-horizontal-debug-rules-switch"
        />
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Status"
    :isDrawer="isDrawer"
    description=""
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldSwitchBlock
          nameField="isActive"
          name="isActive"
          auto
          :isCard="false"
          title="Active"
          subtitle=""
          data-testid="form-horizontal-active-switch"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
