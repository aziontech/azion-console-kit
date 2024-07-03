<script setup>
  import { useField } from 'vee-validate'
  import FieldText from '@/templates/form-fields-inputs/fieldText'
  import FieldDropdown from '@/templates/form-fields-inputs/fieldDropdown'
  import { computed } from 'vue'

  const props = defineProps({
    teams: {
      type: Array,
      required: true,
      default: () => []
    }
  })

  const { value: name } = useField('name')
  const { value: email } = useField('email')
  const { value: team } = useField('team')

  const loadingTeams = computed(() => props.teams.length === 0)
</script>

<template>
  <div class="flex flex-col lg:flex-row justify-between gap-3 sm:gap-6">
    <div class="flex flex-col w-full gap-2">
      <FieldText
        label="Full Name"
        required
        name="name"
        :value="name"
      />
    </div>

    <div class="flex flex-col w-full gap-2">
      <FieldText
        label="Email"
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
        :options="props.teams"
        :loading="loadingTeams"
        :disabled="loadingTeams"
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
