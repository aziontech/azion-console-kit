<script setup>
  import { ref } from 'vue'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputSwitch from 'primevue/inputswitch'
  import Card from 'primevue/card'
  import Dropdown from 'primevue/dropdown'
  import FieldText from '@/templates/form-fields-inputs/fieldText'

  import { useField } from 'vee-validate'
  defineOptions({ name: 'form-fields-waf-rules' })

  const props = defineProps({
    disabledActive: {
      type: Boolean,
      default: true
    }
  })

  const { value: active } = useField('active')
  const { value: crossSiteScriptingSensitivity } = useField('crossSiteScriptingSensitivity')
  const { value: directoryTraversalSensitivity } = useField('directoryTraversalSensitivity')
  const { value: evadingTricksSensitivity } = useField('evadingTricksSensitivity')
  const { value: fileUploadSensitivity } = useField('fileUploadSensitivity')
  const { value: identifiedAttackSensitivity } = useField('identifiedAttackSensitivity')
  const { value: remoteFileInclusionSensitivity } = useField('remoteFileInclusionSensitivity')
  const { value: sqlInjectionSensitivity } = useField('sqlInjectionSensitivity')
  const { value: unwantedAccessSensitivity } = useField('unwantedAccessSensitivity')
  const { value: fileUpload } = useField('fileUpload')
  const { value: evadingTricks } = useField('evadingTricks')
  const { value: unwantedAccess } = useField('unwantedAccess')
  const { value: identifiedAttack } = useField('identifiedAttack')
  const { value: crossSiteScripting } = useField('crossSiteScripting')
  const { value: directoryTraversal } = useField('directoryTraversal')
  const { value: remoteFileInclusion } = useField('remoteFileInclusion')
  const { value: sqlInjection } = useField('sqlInjection')
  const { value: name } = useField('name')

  const sensitivity = ref([
    { name: 'Sensitivity Highest', value: 'highest' },
    { name: 'Sensitivity High', value: 'high' },
    { name: 'Sensitivity Medium', value: 'medium' },
    { name: 'Sensitivity Low', value: 'low' },
    { name: 'Sensitivity Lowest', value: 'lowest' }
  ])
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
          :value="name"
          placeholder="My WAF rule set"
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
        <label class="text-color text-sm font-medium">Threat Type Configuration</label>
        <div class="flex flex-col gap-3">
          <Card
            :pt="{
              body: {
                class: `p-4 border rounded-md ${
                  sqlInjection ? 'border-orange-500' : 'border-transparent'
                }`
              },
              title: { class: 'flex justify-between  text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">SQL Injection</span>
              <InputSwitch
                id="secret"
                v-model="sqlInjection"
              />
            </template>
            <template #subtitle>
              Detect attempts to insert a SQL query via the input data from the client to the
              application.
            </template>
            <template #content>
              <div class="flex flex-col w-full sm:max-w-xs gap-2 mt-3">
                <Dropdown
                  v-model="sqlInjectionSensitivity"
                  :options="sensitivity"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </template>
          </Card>

          <Card
            :pt="{
              body: {
                class: `p-4 border rounded-md ${
                  remoteFileInclusion ? 'border-orange-500' : 'border-transparent'
                } `
              },
              title: { class: 'flex justify-between  text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Remote File Inclusions (RFI)</span>
              <InputSwitch
                id="secret"
                v-model="remoteFileInclusion"
              />
            </template>
            <template #subtitle>
              Detect attempts to include a remote file, usually through a script on the web server.
            </template>
            <template #content>
              <div class="flex flex-col w-full sm:max-w-xs gap-2 mt-3">
                <Dropdown
                  v-model="remoteFileInclusionSensitivity"
                  :options="sensitivity"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </template>
          </Card>

          <Card
            :pt="{
              body: {
                class: `p-4 border rounded-md ${
                  directoryTraversal ? 'border-orange-500' : 'border-transparent'
                }`
              },
              title: { class: 'flex justify-between  text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Directory Traversal</span>
              <InputSwitch
                id="secret"
                v-model="directoryTraversal"
              />
            </template>
            <template #subtitle>
              Prevent exploiting insufficient security sanitizing of user-supplied input file names,
              so that characters representing "traverse to parent directory" are passed through to
              the file APIs.
            </template>
            <template #content>
              <div class="flex flex-col w-full sm:max-w-xs gap-2 mt-3">
                <Dropdown
                  v-model="directoryTraversalSensitivity"
                  :options="sensitivity"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </template>
          </Card>

          <Card
            :pt="{
              body: {
                class: `p-4 border rounded-md ${
                  crossSiteScripting ? 'border-orange-500' : 'border-transparent'
                }`
              },
              title: { class: 'flex justify-between  text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Cross-Site Scripting (XSS)</span>
              <InputSwitch
                id="secret"
                v-model="crossSiteScripting"
              />
            </template>
            <template #subtitle>
              Prevents the injection of client-side scripts into pages viewed by visitors.
            </template>
            <template #content>
              <div class="flex flex-col w-full sm:max-w-xs gap-2 mt-3">
                <Dropdown
                  v-model="crossSiteScriptingSensitivity"
                  :options="sensitivity"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </template>
          </Card>
          <Card
            :pt="{
              body: {
                class: `p-4 border rounded-md ${
                  fileUpload ? 'border-orange-500' : 'border-transparent'
                }`
              },
              title: { class: 'flex justify-between  text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">File Upload</span>
              <InputSwitch
                id="secret"
                v-model="fileUpload"
              />
            </template>
            <template #subtitle> Detect attempts to upload files. </template>
            <template #content>
              <div class="flex flex-col w-full sm:max-w-xs gap-2 mt-3">
                <Dropdown
                  v-model="fileUploadSensitivity"
                  :options="sensitivity"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </template>
          </Card>

          <Card
            :pt="{
              body: {
                class: `p-4 border rounded-md ${
                  evadingTricks ? 'border-orange-500' : 'border-transparent'
                }`
              },
              title: { class: 'flex justify-between  text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Evading Tricks</span>
              <InputSwitch
                id="secret"
                v-model="evadingTricks"
              />
            </template>
            <template #subtitle>
              Prevent the use of encoding tricks to evade protection mechanisms.
            </template>
            <template #content>
              <div class="flex flex-col w-full sm:max-w-xs gap-2 mt-3">
                <Dropdown
                  v-model="evadingTricksSensitivity"
                  :options="sensitivity"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </template>
          </Card>
          <Card
            :pt="{
              body: {
                class: `p-4 border rounded-md ${
                  unwantedAccess ? 'border-orange-500' : 'border-transparent'
                }`
              },
              title: { class: 'flex justify-between  text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Unwanted Access</span>
              <InputSwitch
                id="secret"
                v-model="unwantedAccess"
              />
            </template>
            <template #subtitle>
              Detect attempts to access vulnerable or administrative pages and the use of security
              scanning bots and tools.
            </template>
            <template #content>
              <div class="flex flex-col w-full sm:max-w-xs gap-2 mt-3">
                <Dropdown
                  v-model="unwantedAccessSensitivity"
                  :options="sensitivity"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </template>
          </Card>
          <Card
            :pt="{
              body: {
                class: `p-4 border rounded-md ${
                  identifiedAttack ? 'border-orange-500' : 'border-transparent'
                }`
              },
              title: { class: 'flex justify-between  text-base m-0 font-medium' },
              subtitle: {
                class: 'text-sm font-normal text-color-secondary m-0 pr-0 md:pr-[2.5rem]'
              }
            }"
          >
            <template #title>
              <span class="text-base">Identified Attack</span>
              <InputSwitch
                id="secret"
                v-model="identifiedAttack"
              />
            </template>
            <template #subtitle>
              Prevent common vulnerabilities by blocking known attacks in applications and servers.
            </template>
            <template #content>
              <div class="flex flex-col w-full sm:max-w-xs gap-2 mt-3">
                <Dropdown
                  v-model="identifiedAttackSensitivity"
                  :options="sensitivity"
                  optionLabel="name"
                  optionValue="value"
                  class="w-full"
                />
              </div>
            </template>
          </Card>
        </div>
      </div>
    </template>
  </FormHorizontal>
  <form-horizontal title="Status">
    <template #inputs>
      <div class="flex gap-3 items-center">
        <InputSwitch
          id="active"
          v-model="active"
          :disabled="props.disabledActive"
        />
        <label
          for="active"
          class="text-base"
          >Active</label
        >
      </div>
    </template>
  </form-horizontal>
</template>
