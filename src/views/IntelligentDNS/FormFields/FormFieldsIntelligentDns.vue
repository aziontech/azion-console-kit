<script setup>
  import InputText from 'primevue/inputtext'
  import InputSwitch from 'primevue/inputswitch'
  import { useIntelligentDNSStore } from '@/stores/intelligent-dns'
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import { watch } from 'vue'

  const intelligentDNSStore = useIntelligentDNSStore()

  const { value: name, errorMessage: errorName } = useField('name')
  const { value: domain, errorMessage: errorDomain } = useField('domain')
  const { value: isActive } = useField('isActive')

  watch(domain, () => {
    intelligentDNSStore.addDomain(domain.value)
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
        <small class="text-xs text-color-secondary font-normal leading-tight">
          Give a unique and easy-to-remember name.</small
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
          placeholder="mydomain"
          type="text"
          :class="{ 'p-invalid': errorDomain }"
        />
        <small class="text-xs text-color-secondary font-normal leading-tight">
          Add the name of the domain. Example: <code>mydomain</code> in <code>mydomain.com</code></small
        >
        <small
          v-if="errorDomain"
          class="p-error text-xs font-normal leading-tight"
          >{{ errorDomain }}</small
        >
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Status"
  >
    <template #inputs>
      <div class="flex gap-3 items-center">
        <label for="">Active</label>
        <InputSwitch v-model="isActive" />
      </div>
    </template>
  </FormHorizontal>
</template>
