<template>
  <FormHorizontal
    data-testid="form-horizontal-domain-dropdown"
    isDrawer
    :hiddenTitle="true"
    :noBorder="true"
  >
    <template #inputs>
      <DrawerDomain
        ref="drawerDomainlRef"
        @onSuccess="handleDomainCreated"
      />
      <div class="flex flex-col w-full sm:max-w-xs gap-2">
        <FieldDropdownLazyLoader
          data-testid="edge-app-form__domain-field"
          label="Domain"
          name="domain"
          :service="listDomainsService"
          :loadService="loadDomainsService"
          optionLabel="name"
          optionValue="value"
          :value="domain"
          appendTo="self"
          placeholder="Select a Domain"
          @onSelectOption="getWorkloadDeployment"
        >
          <template #footer>
            <ul class="p-2">
              <li>
                <PrimeButton
                  class="w-full whitespace-nowrap flex"
                  text
                  @click="openDrawerDomain"
                  size="small"
                  icon="pi pi-plus-circle"
                  data-testid="edge-app-form__create-domain-button"
                  :pt="{
                    label: { class: 'w-full text-left' },
                    root: { class: 'p-2' }
                  }"
                  label="Create Domain"
                />
              </li>
            </ul>
          </template>
        </FieldDropdownLazyLoader>
      </div>
    </template>
  </FormHorizontal>
</template>
<script setup>
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import FieldDropdownLazyLoader from '@/templates/form-fields-inputs/fieldDropdownLazyLoader'
  import DrawerDomain from '@/views/Domains/Drawer'
  import PrimeButton from 'primevue/button'

  import { ref } from 'vue'

  import { useField } from 'vee-validate'

  defineProps({
    listDomainsService: {
      type: Function,
      required: true
    },
    loadDomainsService: {
      type: Function,
      required: true
    }
  })
  const drawerDomainlRef = ref('')

  const { value: domain } = useField('domain')

  const openDrawerDomain = () => {
    drawerDomainlRef.value.openCreateDrawer()
  }

  const handleDomainCreated = (value) => {
    domain.value = value
  }
</script>
