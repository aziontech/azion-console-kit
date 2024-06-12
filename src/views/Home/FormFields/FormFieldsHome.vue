<script setup>
  import Dropdown from 'primevue/dropdown'
  import InputText from 'primevue/inputtext'
  import { useField } from 'vee-validate'

  const props = defineProps({
    teams: {
      type: Array,
      required: true,
      default: () => []
    }
  })

  const { value: name, errorMessage: errorName } = useField('name')
  const { value: email, errorMessage: errorEmail } = useField('email')
  const { value: team, errorMessage: errorTeam } = useField('team')
</script>

<template>
  <!-- Input Name -->
  <div class="flex flex-col w-full gap-2">
    <label
      for="name"
      class="text-color text-sm font-medium"
      >Full Name *</label
    >
    <InputText
      v-model="name"
      id="name"
      type="text"
      :class="{ 'p-invalid': errorName }"
    />
    <small
      v-if="errorName"
      class="p-error text-xs font-normal leading-tight"
      >{{ errorName }}</small
    >
  </div>

  <!-- Input Email -->
  <div class="flex flex-col w-full gap-2">
    <label
      for="email"
      class="text-color text-sm font-medium"
      >Email *</label
    >
    <InputText
      v-model="email"
      id="email"
      type="text"
      :class="{ 'p-invalid': errorEmail }"
    />
    <small
      v-if="errorEmail"
      class="p-error text-xs font-normal leading-tight"
      >{{ errorEmail }}</small
    >
  </div>

  <!-- Input Team -->
  <div class="flex flex-col w-full gap-2">
    <label
      for="team"
      class="text-color text-sm font-medium"
      >Team *</label
    >
    <Dropdown
      appendTo="self"
      id="team"
      :class="{ 'p-invalid': errorTeam }"
      v-model="team"
      :options="props.teams"
      optionLabel="label"
      optionValue="value"
      class="w-full"
      placeholder="Select a team"
    />
    <small
      v-if="errorTeam"
      class="p-error text-xs font-normal leading-tight"
      >{{ errorTeam }}</small
    >
  </div>
</template>
