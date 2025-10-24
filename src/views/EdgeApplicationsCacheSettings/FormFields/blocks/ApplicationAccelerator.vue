<template>
  <FormHorizontal
    title="Application Accelerator"
    description="Enhance application performance by defining how cache varies based on specific request attributes."
    isDrawer
  >
    <template #inputs>
      <!-- Cache vary by Method -->
      <Accordion>
        <AccordionTab>
          <template #header>
            <div class="flex flex-row items-center justify-between w-full">
              <div>
                <div class="flex flex-row items-center gap-3">
                  <p>Cache vary by Method</p>
                </div>
                <div class="flex gap-2">
                  <div class="flex gap-1">
                    <p class="text-sm font-normal text-color-secondary">Method:</p>
                    <p class="text-sm font-medium text-color">{{ selectedMethod }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>
          <div class="flex flex-col w-full gap-5">
            <FieldGroupCheckbox
              :options="layerFileOptimizationRadioOptions"
              :isCard="false"
              :hasDivider="false"
              data-testid="edge-application-cache-settings-form__slice-configuration-layer-field"
            />
          </div>
        </AccordionTab>
      </Accordion>

      <!-- Cache vary by Query String -->
      <Accordion>
        <AccordionTab>
          <template #header>
            <div class="flex flex-row items-center justify-between w-full">
              <div>
                <div class="flex flex-row items-center gap-3">
                  <p>Cache vary by Query String</p>
                </div>
                <div class="flex gap-2">
                  <div class="flex gap-1">
                    <p class="text-sm font-normal text-color-secondary">Behavior:</p>
                    <p class="text-sm font-medium text-color capitalize">
                      {{ cacheByQueryString }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div class="flex flex-col w-full gap-5">
            <div class="flex flex-col w-3/4 gap-2 sm:max-w-lg">
              <FieldDropdown
                label="Behavior"
                name="cacheByQueryString"
                :options="behaviorsByType.queryString"
                optionLabel="label"
                optionValue="value"
                :value="cacheByQueryString"
                appendTo="self"
                description="Specify how the cache should handle query string parameters."
                data-testid="edge-application-cache-settings-form__accelarator__cache-by-query-string-behavior-field"
              />
            </div>
            <div
              v-if="showQueryFields"
              class="flex flex-col w-full gap-2"
            >
              <FieldTextArea
                label="Fields"
                required
                name="queryStringFields"
                :value="queryStringFields"
                :placeholder="`user_id\nsession_token\nproduct_id`"
                description="Enter the query string parameters to be considered for cache variation. Use line breaks to add multiple entries."
                data-testid="edge-application-cache-settings-form__query-string-fields-field"
              />
            </div>

            <FieldSwitchBlock
              nameField="enableQueryStringSort"
              name="enableQueryStringSort"
              auto
              :isCard="false"
              :value="enableQueryStringSort"
              title="Sort"
              description="Enable sorting of query string parameters to ensure consistent cache behavior regardless of parameter order."
              data-testid="edge-connectors-form__address-management__enableQueryStringSort-field"
            />
          </div>
        </AccordionTab>
      </Accordion>

      <!-- Cache vary by Cookies -->
      <Accordion>
        <AccordionTab>
          <template #header>
            <div class="flex flex-row items-center justify-between w-full">
              <div>
                <div class="flex flex-row items-center gap-3">
                  <p>Cache vary by Cookies</p>
                </div>
                <div class="flex gap-2">
                  <div class="flex gap-1">
                    <p class="text-sm font-normal text-color-secondary">Behavior:</p>
                    <p class="text-sm font-medium text-color capitalize">{{ cacheByCookies }}</p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div class="flex flex-col w-full gap-5">
            <div class="flex flex-col w-3/4 gap-2 sm:max-w-lg">
              <FieldDropdown
                label="Behavior"
                name="cacheByCookies"
                :options="behaviorsByType.cookies"
                optionLabel="label"
                optionValue="value"
                :value="cacheByCookies"
                appendTo="self"
                description="Define how the cache should handle cookies."
                data-testid="edge-application-cache-settings-form__accelarator__cache-by-cookie-behavior-field"
              />
            </div>

            <div
              v-if="showCookieNames"
              class="flex flex-col w-full gap-2"
            >
              <FieldTextArea
                label="Fields"
                class="w-full"
                required
                name="cookieNames"
                :value="cookieNames"
                :placeholder="`user_id\nsession_token\nproduct_id`"
                description="Enter the cookie names to be considered for cache variation. Use line breaks to add multiple entries."
                data-testid="edge-application-cache-settings-form__cache-by-cookie-fields-field"
              />
            </div>
          </div>
        </AccordionTab>
      </Accordion>

      <!-- Cache vary by Devices -->
      <Accordion>
        <AccordionTab>
          <template #header>
            <div class="flex flex-row items-center justify-between w-full">
              <div>
                <div class="flex flex-row items-center gap-3">
                  <p>Cache vary by Devices</p>
                </div>
                <div class="flex gap-2">
                  <div class="flex gap-1">
                    <p class="text-sm font-normal text-color-secondary">Behavior:</p>
                    <p class="text-sm font-medium text-color capitalize">
                      {{ adaptiveDeliveryAction }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <div class="flex flex-col w-3/5 gap-5">
            <div class="flex flex-col gap-2">
              <FieldDropdown
                label="Behavior"
                name="adaptiveDeliveryAction"
                :value="adaptiveDeliveryAction"
                :options="behaviorsByType.devices"
                optionLabel="label"
                optionValue="value"
                appendTo="self"
                description="Configure whether the cache should vary based on the type of device making the request."
                data-testid="edge-application-cache-settings-form__accelerator__cache-by-device-behavior-field"
              />
            </div>

            <div
              v-if="showDeviceGroupFields"
              class="flex flex-col gap-2"
            >
              <FieldDropdownMultiSelectLazyLoader
                ref="deviceGroupFieldRef"
                name="deviceGroup"
                class="w-full"
                label="Device Group"
                required
                :service="listDeviceGroupsWithDecorator"
                :loadService="deviceGroupService.loadDeviceGroupService"
                :optionLabel="'name'"
                :optionValue="'id'"
                :value="deviceGroup"
                placeholder="Select Device Groups"
                description="Select a device group to customize cache behavior for specific categories."
                data-testid="edge-application-cache-settings-form__device-groups-multiselect"
              >
                <template #footer>
                  <ul class="p-2">
                    <li>
                      <PrimeButton
                        @click="openCreateDeviceGroupDrawer"
                        class="w-full whitespace-nowrap flex"
                        data-testid="domains-form__create-edge-firewall-button"
                        text
                        size="small"
                        icon="pi pi-plus-circle"
                        :pt="{
                          label: { class: 'w-full text-left' },
                          root: { class: 'p-2' }
                        }"
                        label="Create Device Group"
                      />
                    </li>
                  </ul>
                </template>
              </FieldDropdownMultiSelectLazyLoader>
            </div>
          </div>
        </AccordionTab>
      </Accordion>
    </template>
  </FormHorizontal>

  <DrawerDeviceGroups
    ref="drawerDeviceGroups"
    @onSuccess="handleSuccessDrawerDeviceGroups"
    :edgeApplicationId="edgeApplicationId"
    :createDeviceGroupService="deviceGroupService.createDeviceGroupService"
    :loadDeviceGroupService="deviceGroupService.loadDeviceGroupService"
    :editDeviceGroupService="deviceGroupService.editDeviceGroupService"
  />
</template>

<script setup>
  import Accordion from 'primevue/accordion'
  import AccordionTab from 'primevue/accordiontab'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal.vue'
  import FieldGroupCheckbox from '@/templates/form-fields-inputs/fieldGroupCheckbox'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import FieldTextArea from '@/templates/form-fields-inputs/fieldTextArea'
  import FieldDropdownMultiSelectLazyLoader from '@/templates/form-fields-inputs/fieldDropdownMultiSelectLazyLoader.vue'
  import FieldSwitchBlock from '@/templates/form-fields-inputs/fieldSwitchBlock'
  import DrawerDeviceGroups from '@/views/EdgeApplicationsDeviceGroups/Drawer'
  import PrimeButton from 'primevue/button'
  import { deviceGroupService } from '@/services/v2/edge-app/edge-app-device-group-service'
  import { useRoute } from 'vue-router'

  import { computed, ref } from 'vue'
  import { useField } from 'vee-validate'

  const route = useRoute()
  const edgeApplicationId = route.params.id
  const drawerDeviceGroups = ref('')
  const deviceGroupFieldRef = ref('')

  const layerFileOptimizationRadioOptions = computed(() => [
    {
      title: 'POST',
      description:
        'Enable caching for POST requests, allowing specific POST responses to be stored and reused.',
      value: false,
      nameField: 'enableCachingForPost',
      binary: true
    },
    {
      title: 'OPTIONS',
      description:
        'Enable caching for OPTIONS requests, allowing specific OPTIONS responses to be stored and reused.',
      value: false,
      nameField: 'enableCachingForOptions',
      binary: true
    }
  ])

  const { value: cacheByQueryString } = useField('cacheByQueryString')
  const { value: queryStringFields } = useField('queryStringFields')

  const { value: cacheByCookies } = useField('cacheByCookies')
  const { value: cookieNames } = useField('cookieNames')

  const { value: enableCachingForPost } = useField('enableCachingForPost')
  const { value: enableCachingForOptions } = useField('enableCachingForOptions')

  const { value: adaptiveDeliveryAction } = useField('adaptiveDeliveryAction')
  const { value: deviceGroup } = useField('deviceGroup')

  const behaviors = {
    ignore: {
      label: 'Ignore',
      value: 'ignore'
    },
    allowlist: {
      label: 'Allowlist',
      value: 'allowlist'
    },
    denylist: {
      label: 'Denylist',
      value: 'denylist'
    },
    all: {
      label: 'All',
      value: 'all'
    }
  }

  const behaviorsByType = computed(() => {
    return {
      queryString: [behaviors.allowlist, behaviors.denylist, behaviors.ignore, behaviors.all],
      cookies: [behaviors.allowlist, behaviors.denylist, behaviors.ignore, behaviors.all],
      devices: [behaviors.allowlist, behaviors.ignore]
    }
  })

  const showQueryFields = computed(() => {
    return ['allowlist', 'denylist'].includes(cacheByQueryString.value)
  })
  const showCookieNames = computed(() => {
    return ['allowlist', 'denylist'].includes(cacheByCookies.value)
  })
  const showDeviceGroupFields = computed(() => {
    return adaptiveDeliveryAction.value === 'allowlist'
  })

  const selectedMethod = computed(() => {
    const selectedMethods = []

    if (enableCachingForPost.value) {
      selectedMethods.push('POST')
    }

    if (enableCachingForOptions.value) {
      selectedMethods.push('OPTIONS')
    }

    return selectedMethods.join(', ') || 'None'
  })

  const listDeviceGroupsWithDecorator = async (params) => {
    return await deviceGroupService.listDeviceGroupService(edgeApplicationId, params)
  }

  const openCreateDeviceGroupDrawer = () => {
    drawerDeviceGroups.value.openDrawerCreate()
  }

  const handleSuccessDrawerDeviceGroups = (createdItemId) => {
    drawerDeviceGroups.value.closeDrawer()
    deviceGroupFieldRef.value.refreshData()
    deviceGroup.value = [...deviceGroup.value, createdItemId]
  }
</script>
