<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldGroupSwitch from '@/templates/form-fields-inputs/fieldGroupSwitch.vue'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'

  import { ref } from 'vue'

  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-waf-rules' })

  const props = defineProps({
    disabledActive: {
      type: Boolean,
      default: true
    }
  })

  const { value: name } = useField('name')

  const sensitivity = ref([
    { name: 'Sensitivity Highest', value: 'highest' },
    { name: 'Sensitivity High', value: 'high' },
    { name: 'Sensitivity Medium', value: 'medium' },
    { name: 'Sensitivity Low', value: 'low' },
    { name: 'Sensitivity Lowest', value: 'lowest' }
  ])

  const switchOptions = [
    {
      title: 'SQL Injection',
      nameField: 'sqlInjection',
      subtitle:
        'Detect attempts to insert a SQL query via the input data from the client to the application.',
      dropdown: {
        value: 'sqlInjectionSensitivity',
        initialValue: 'medium'
      }
    },
    {
      title: 'Remote File Inclusions (RFI)',
      nameField: 'remoteFileInclusion',
      subtitle:
        'Detect attempts to include a remote file, usually through a script on the web server.',
      dropdown: {
        value: 'remoteFileInclusionSensitivity',
        initialValue: 'medium'
      }
    },
    {
      title: 'Directory Traversal',
      nameField: 'directoryTraversal',
      subtitle:
        'Prevent exploiting insufficient security sanitizing of user-supplied input file names, so that characters representing "traverse to parent directory" are passed through to the file APIs.',
      dropdown: {
        value: 'directoryTraversalSensitivity',
        initialValue: 'medium'
      }
    },
    {
      title: 'Cross-Site Scripting (XSS)',
      nameField: 'crossSiteScripting',
      subtitle: 'Prevents the injection of client-side scripts into pages viewed by visitors.',
      dropdown: {
        value: 'crossSiteScriptingSensitivity',
        initialValue: 'medium'
      }
    },
    {
      title: 'File Upload',
      nameField: 'fileUpload',
      subtitle: 'Detect attempts to upload files.',
      dropdown: {
        value: 'fileUploadSensitivity',
        initialValue: 'medium'
      }
    },
    {
      title: 'Evading Tricks',
      nameField: 'evadingTricks',
      subtitle: 'Prevent the use of encoding tricks to evade protection mechanisms.',
      dropdown: {
        value: 'evadingTricksSensitivity',
        initialValue: 'medium'
      }
    },
    {
      title: 'Unwanted Access',
      nameField: 'unwantedAccess',
      subtitle:
        'Detect attempts to access vulnerable or administrative pages and the use of security scanning bots and tools.',
      dropdown: {
        value: 'unwantedAccessSensitivity',
        initialValue: 'medium'
      }
    },
    {
      title: 'Identified Attack',
      nameField: 'identifiedAttack',
      subtitle:
        'Prevent common vulnerabilities by blocking known attacks in applications and servers.',
      dropdown: {
        value: 'identifiedAttackSensitivity',
        initialValue: 'medium'
      }
    }
  ]
</script>

<template>
  <FormHorizontal
    title="General"
    description="Create a WAF rule set to protect servers and edge applications against threat families. Configure a behavior on Rules Engine for Edge Firewall to apply and run this rule set."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <FieldText
          label="Name *"
          description="Give a unique and descriptive name to identify the WAF rule set."
          name="name"
          data-testid="waf-rules-form__name-field"
          :value="name"
          placeholder="My WAF rule"
        />
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="WAF Rule Set"
    description="Configure the threat types and sensitivity levels WAF should block."
  >
    <template #inputs>
      <div class="flex flex-col gap-2">
        <FieldGroupSwitch
          label="Threat Type Configuration"
          isCard
          input-class="w-full"
          :options="switchOptions"
        >
          <template #footer="{ item }">
            <div class="flex flex-col w-full sm:max-w-xs gap-2 mt-3">
              <FieldDropdown
                :options="sensitivity"
                optionLabel="name"
                optionValue="value"
                inputClass=""
                :name="item.dropdown.value"
                :value="item.dropdown.initialValue"
              />
            </div>
          </template>
        </FieldGroupSwitch>
      </div>
    </template>
  </FormHorizontal>
  <form-horizontal title="Status">
    <template #inputs>
      <div class="flex gap-3 items-center">
        <FieldSwitchBlock
          nameField="active"
          name="active"
          auto
          :isCard="false"
          title="Active"
          :disabled="props.disabledActive"
        />
      </div>
    </template>
  </form-horizontal>
</template>
