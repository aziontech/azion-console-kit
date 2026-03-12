<script setup>
  import { useField } from 'vee-validate'
  import FieldText from '@aziontech/webkit/field-text'
  import FieldDropdown from '@aziontech/webkit/field-dropdown'
  import { onMounted, ref } from 'vue'
  import { teamsService } from '@/services/v2/teams/teams-service'

  const teams = ref([])
  const loading = ref(true)

  const fetchTeams = async () => {
    try {
      teams.value = await teamsService.useListTeams()
    } finally {
      loading.value = false
    }
  }

  onMounted(() => fetchTeams())

  const { value: name } = useField('name')
  const { value: email } = useField('email')
  const { value: team } = useField('team')
</script>

<template>
  <div class="flex flex-col lg:flex-row justify-between gap-3 sm:gap-4">
    <div class="flex flex-col w-full gap-2">
      <FieldText
        label="Full Name"
        placeholder="John Doe"
        required
        name="name"
        :value="name"
      />
    </div>

    <div class="flex flex-col w-full gap-2">
      <FieldText
        label="Email"
        placeholder="email@example.com"
        required
        name="email"
        type="email"
        :value="email"
      />
    </div>

    <div class="flex flex-col w-full gap-2">
      <FieldDropdown
        label="Team"
        required
        name="team"
        :options="teams"
        :loading="loading"
        :disabled="loading"
        optionLabel="label"
        optionValue="value"
        :value="team"
        id="team"
        filter
        appendTo="self"
        placeholder="Select a team"
      />
    </div>
  </div>
</template>
