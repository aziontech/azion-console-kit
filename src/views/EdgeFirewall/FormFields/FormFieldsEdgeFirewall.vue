<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import PrimeTag from 'primevue/tag'
  import { useField } from 'vee-validate'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch.vue'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  defineOptions({ name: 'form-fields-edge-firewall' })

  const { value: name } = useField('name')

  const switchOptions = [
    {
      title: 'DDoS Protection Unmetered',
      nameField: 'ddosProtectionUnmetered',
      disabled: true,
      value: true,
      subtitle:
        'Mitigate large and complex network, transport, presentation, and application-layer DDoS attacks.',
      tag: {
        value: 'Automatically enabled in all accounts',
        icon: 'pi pi-lock'
      }
    },
    {
      title: 'Edge Functions',
      nameField: 'edgeFunctionsEnabled',
      subtitle: 'Build ultra-low latency functions that run on the edge.'
    },
    {
      title: 'Network Layer Protection',
      nameField: 'networkProtectionEnabled',
      subtitle:
        'Create lists to configure a programmable security perimeter for inbound and outbound traffic at the edge.'
    },
    {
      title: 'Web Application Firewall',
      nameField: 'wafEnabled',
      subtitle: 'Protect edge applications against threats and attacks.'
    }
  ]
</script>

<template>
  <FormHorizontal
    title="General"
    description="Create an edge firewall to configure security logics and protect servers and applications."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name"
          required
          name="name"
          data-testid="edge-firewall-form__name-field"
          :value="name"
          placeholder="My edge firewall"
          description="Give a unique and descriptive name to identify the edge firewall."
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Modules"
    description="Activate modules to extend configuration possibilities. Some modules require subscription."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldGroupSwitch
          isCard
          :options="switchOptions"
        >
          <template #footer="{ item }">
            <PrimeTag
              v-if="item?.tag"
              :value="item.tag.value"
              :icon="item.tag.icon"
              severity="info"
              class="mt-3"
            />
          </template>
        </FieldGroupSwitch>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Debug Rules"
    description="Log executed rules created in Rules Engine. Query logs using Data Stream, Real-Time Events, or Real-Time Events GraphQL API."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldSwitchBlock
          nameField="debugRules"
          name="debugRules"
          auto
          :isCard="false"
          title="Active"
          subtitle="Rules that were successfully executed will be shown under the $traceback field in Data Streaming and Real-Time Events or the $stacktrace variable in GraphQL."
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal title="Status">
    <template #inputs>
      <div class="flex flex-col w-full gap-2">
        <FieldSwitchBlock
          nameField="isActive"
          name="isActive"
          auto
          :isCard="false"
          title="Active"
        />
      </div>
    </template>
  </FormHorizontal>
</template>
