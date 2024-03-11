<script setup>
  import { useEdgeDNSStore } from '@/stores/edge-dns'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputSwitch from 'primevue/inputswitch'
  import InputText from 'primevue/inputtext'
  import { useField } from 'vee-validate'
  import { watch } from 'vue'

  const edgeDNSStore = useEdgeDNSStore()

  const { value: name, errorMessage: errorName } = useField('name')
  const { value: domain, errorMessage: errorDomain } = useField('domain')
  const { value: isActive } = useField('isActive')

  watch(domain, () => {
    edgeDNSStore.addDomain(domain.value)
  })
</script>

<template>
  <FormHorizontal
    title="General"
    description="Create zones to host your domain on Azion's distributed infrastructure."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="name"
          class="text-color text-base font-medium"
          >Name *</label
        >
        <InputText
          v-model="name"
          placeholder="My zone"
          id="name"
          type="text"
          :class="{ 'p-invalid': errorName }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Give a unique and descriptive name.</small
        >
        <small
          v-if="errorName"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorName }}</small
        >
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Domain"
    description="Provide a name to the domain you want to host."
  >
    <template #inputs>
      <div class="flex flex-col sm:max-w-lg w-full gap-2">
        <label
          for="domain"
          class="text-color text-base font-medium"
          >Domain Name *</label
        >
        <InputText
          id="domain"
          v-model="domain"
          placeholder="mydomain.com"
          type="text"
          :class="{ 'p-invalid': errorDomain }"
        />
        <small class="text-xs text-color-secondary font-normal leading-5">
          Add the full domain host name. Example: <code>mydomain.com</code>.</small
        >
        <small
          v-if="errorDomain"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorDomain }}</small
        >
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal title="Status">
    <template #inputs>
      <div class="flex gap-3 items-center">
        <InputSwitch
          id="active"
          v-model="isActive"
        />
        <label id="active">Active</label>
      </div>
    </template>
  </FormHorizontal>
</template>
