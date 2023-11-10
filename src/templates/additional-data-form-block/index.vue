<template>
  <form
    class="w-full flex flex-col gap-6"
    @submit.prevent="submitForm"
  >
    <div class="flex flex-col gap-3">
      <label class="font-semibold text-sm">What description best fits your work? </label>
      <div class="flex flex-wrap gap-2">
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="occupation1"
            class="mr-2 text-xs"
            >Developer</label
          >
          <PrimeRadio
            v-model="occupation"
            inputId="occupation1"
            name="occupation"
            value="Developer"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="occupation2"
            class="mr-2 text-xs"
            >DevOps</label
          >
          <PrimeRadio
            v-model="occupation"
            inputId="occupation2"
            name="occupation"
            value="DevOps"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="occupation3"
            class="mr-2 text-xs"
            >System Admin</label
          >
          <PrimeRadio
            v-model="occupation"
            inputId="occupation3"
            name="occupation"
            value="System Admin"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="occupation4"
            class="mr-2 text-xs"
            >Security Analyst</label
          >
          <PrimeRadio
            v-model="occupation"
            inputId="occupation4"
            name="occupation"
            value="Security Analyst"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="occupation5"
            class="mr-2 text-xs"
            >Team Lead</label
          >
          <PrimeRadio
            v-model="occupation"
            inputId="occupation5"
            name="occupation"
            value="Team Lead"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="occupation6"
            class="mr-2 text-xs"
            >Other</label
          >
          <PrimeRadio
            v-model="occupation"
            inputId="occupation6"
            name="occupation"
            value="Other"
          />
        </PrimeButton>
      </div>
      <label class="font-semibold text-sm">What would you like to build with Azion? </label>
      <div class="flex flex-wrap gap-2">
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="intention1"
            class="mr-2 text-xs"
            >Just a personal project</label
          >
          <PrimeRadio
            v-model="intention"
            inputId="intention1"
            name="intention"
            value="Just a personal project"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="intention2"
            class="mr-2 text-xs"
            >Projects for my company</label
          >
          <PrimeRadio
            v-model="intention"
            inputId="intention2"
            name="intention"
            value="Projects for my company"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="intention3"
            class="mr-2 text-xs"
            >Multiple projects for other companies</label
          >
          <PrimeRadio
            v-model="intention"
            inputId="intention3"
            name="intention"
            value="Multiple projects for other companies"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="intention4"
            class="mr-2 text-xs"
            >Other</label
          >
          <PrimeRadio
            v-model="intention"
            inputId="intention4"
            name="intention"
            value="Other"
          />
        </PrimeButton>
      </div>
      <label class="font-semibold text-sm">What are you building? </label>
      <div class="flex flex-wrap gap-2">
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="building1"
            class="mr-2 text-xs"
            >Web Apps</label
          >
          <PrimeRadio
            v-model="building"
            inputId="building1"
            name="building"
            value="Web Apps"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="building2"
            class="mr-2 text-xs"
            >Mobile Apps</label
          >
          <PrimeRadio
            v-model="building"
            inputId="building2"
            name="building"
            value="Mobile Apps"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="building3"
            class="mr-2 text-xs"
            >Static Websites</label
          >
          <PrimeRadio
            v-model="building"
            inputId="building3"
            name="building"
            value="Static Websites"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="building4"
            class="mr-2 text-xs"
            >Blogs</label
          >
          <PrimeRadio
            v-model="building"
            inputId="building4"
            name="building"
            value="Blogs"
          />
        </PrimeButton>
        <PrimeButton
          outlined
          class="min-w-fit"
        >
          <label
            for="building5"
            class="mr-2 text-xs"
            >Firewall</label
          >
          <PrimeRadio
            v-model="building"
            inputId="building5"
            name="building"
            value="Firewall"
          />
        </PrimeButton>
      </div>
    </div>
    <PrimeButton
      label="Finish Signup"
      type="submit"
      severity="secondary"
      :disabled="!meta.valid"
    />
  </form>
</template>

<script setup>
  import PrimeRadio from 'primevue/radiobutton'
  import PrimeButton from 'primevue/button'
  import { useForm, useField } from 'vee-validate'
  import * as yup from 'yup'

  defineOptions({
    name: 'additional-data-form-block'
  })

  const validationSchema = yup.object({
    occupation: yup.string().required(),
    intention: yup.string().required(),
    building: yup.string().required()
  })

  const { values, meta } = useForm({ validationSchema })

  const { value: occupation } = useField('occupation')
  const { value: intention } = useField('intention')
  const { value: building } = useField('building')

  const submitForm = () => {
    return values
  }
</script>
