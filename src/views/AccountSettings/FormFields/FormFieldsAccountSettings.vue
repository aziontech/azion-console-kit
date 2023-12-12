<script setup>
  import { useField } from 'vee-validate'
  import FormHorizontal from '@/templates/create-form-block/form-horizontal'
  import InputText from 'primevue/inputtext'
  import TextArea from 'primevue/textarea'
  import InputSwitch from 'primevue/inputswitch'
  import Dropdown from 'primevue/dropdown'
  import Divider from 'primevue/divider'

  const { value: accountName, errorMessage: accountNameError } = useField('accountName')
  const { value: clientId } = useField('clientId')
  const { value: companyName } = useField('companyName')
  const { value: uniqueIdentifier } = useField('uniqueIdentifier')
  const { value: billingEmails } = useField('billingEmails')
  const { value: postalCode, errorMessage: postalCodeError } = useField('postalCode')
  const { value: country, errorMessage: countryError } = useField('country')
  const { value: region, errorMessage: regionError } = useField('region')
  const { value: city, errorMessage: cityError } = useField('city')
  const { value: address, errorMessage: addressError } = useField('address')
  const { value: number, errorMessage: numberError } = useField('number')
  const { value: complement } = useField('complement')
  const { value: isSocialLoginEnabled } = useField('isSocialLoginEnabled')
  const { value: isEnabledMfaToAllUsers } = useField('isEnabledMfaToAllUsers')

  const countriesOptions = [{ name: 'Brazil', code: 'BR' }]
  const regionsOptions = [{ name: 'Sao Paulo', code: 'SP' }]
  const citiesOptions = [{ name: 'Sao Paulo', code: 'SP' }]
</script>

<template>
  <FormHorizontal
    title="General"
    description="Description"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <label
          for="accountName"
          class="text-color text-base font-medium"
          >Account name *</label
        >
        <InputText
          v-model="accountName"
          id="accountName"
          type="text"
          :class="{ 'p-invalid': accountNameError }"
        />
        <small
          v-if="accountNameError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ accountNameError }}
        </small>
      </div>

      <div class="flex flex-col w-full sm:max-w-lg gap-2">
        <label
          for="clientId"
          class="text-color text-base font-medium"
          >Client ID</label
        >
        <span class="p-input-icon-right">
          <i class="pi pi-lock text-[var(--text-color-secondary)]" />
          <InputText
            v-model="clientId"
            id="clientId"
            type="text"
            class="w-full"
            readonly
          />
        </span>
      </div>
    </template>
  </FormHorizontal>

  <FormHorizontal
    title="Company Information"
    description="Description"
  >
    <template #inputs>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <label
          for="companyName"
          class="text-color text-base font-medium"
          >Company/Corporate name</label
        >
        <InputText
          v-model="companyName"
          id="companyName"
          type="text"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <label
          for="uniqueIdentifier"
          class="text-color text-base font-medium"
          >Unique identifier</label
        >
        <InputText
          v-model="uniqueIdentifier"
          id="uniqueIdentifier"
          type="text"
        />
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <label
          for="billingEmails"
          class="text-color text-base font-medium"
          >Billing emails</label
        >
        <TextArea
          id="billingEmails"
          v-model="billingEmails"
          rows="5"
          cols="30"
        />
        <small class="text-color-secondary text-sm font-normal leading-tight">
          E-mails address separated by semicolon(;) that will receive billing e-mails.
        </small>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Address Information"
    description="Description"
  >
    <template #inputs>
      <div class="flex flex-col gap-8 md:flex-row md:gap-6">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="postalCode"
            class="text-color text-base font-medium"
            >Postal Code *</label
          >
          <InputText
            v-model="postalCode"
            id="postalCode"
            type="text"
            :class="{ 'p-invalid': postalCodeError }"
          />
          <small
            v-if="postalCodeError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ postalCodeError }}
          </small>
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="country"
            class="text-color text-base font-medium"
            >Country *</label
          >
          <Dropdown
            id="country"
            filter
            optionValue="name"
            optionLabel="name"
            :options="countriesOptions"
            v-model="country"
            :class="{ 'p-invalid': countryError }"
          />
          <small
            v-if="countryError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ countryError }}
          </small>
        </div>
      </div>
      <div class="flex flex-col gap-8 md:flex-row md:gap-6">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="region"
            class="text-color text-base font-medium"
            >State/Region *</label
          >
          <Dropdown
            id="region"
            filter
            optionValue="name"
            optionLabel="name"
            :options="regionsOptions"
            v-model="region"
          />
          <small
            v-if="regionError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ regionError }}
          </small>
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="city"
            class="text-color text-base font-medium"
            >City *</label
          >
          <Dropdown
            id="city"
            filter
            optionValue="name"
            optionLabel="name"
            :options="citiesOptions"
            v-model="city"
            :class="{ 'p-invalid': cityError }"
          />
          <small
            v-if="cityError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ cityError }}
          </small>
        </div>
      </div>
      <div class="flex flex-col w-full gap-2 sm:max-w-lg">
        <label
          for="address"
          class="text-color text-base font-medium"
          >Address *</label
        >
        <InputText
          v-model="address"
          id="address"
          type="text"
          :class="{ 'p-invalid': addressError }"
        />
        <small
          v-if="addressError"
          class="p-error text-xs font-normal leading-tight"
        >
          {{ addressError }}
        </small>
      </div>
      <div class="flex flex-col gap-8 md:flex-row md:gap-6">
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="number"
            class="text-color text-base font-medium"
            >Number *</label
          >
          <InputText
            v-model="number"
            id="number"
            type="text"
            :class="{ 'p-invalid': numberError }"
          />
          <small
            v-if="numberError"
            class="p-error text-xs font-normal leading-tight"
          >
            {{ numberError }}
          </small>
        </div>
        <div class="flex flex-col w-full gap-2 sm:max-w-lg">
          <label
            for="complement"
            class="text-color text-base font-medium"
            >Complement</label
          >
          <InputText
            v-model="complement"
            id="complement"
            type="text"
          />
        </div>
      </div>
    </template>
  </FormHorizontal>
  <FormHorizontal
    title="Security Settings"
    description="Description"
  >
    <template #inputs>
      <div class="w-full flex flex-col gap-2">
        <div class="w-full flex flex-col gap-2 pt-2 pb-3">
          <div class="flex gap-1">
            <InputSwitch
              v-model="isSocialLoginEnabled"
              inputId="isSocialLoginEnabled"
            />
            <label
              class="text-color text-sm font-normal leading-5"
              for="isSocialLoginEnabled"
              >Social login</label
            >
          </div>
          <div class="flex-col gap-1 pl-10">
            <p class="text-color-secondary text-sm font-normal">
              As an Account Owner you can enable/disable the Social Login functionality. When it is
              enabled, users linked to the account can authenticate to RTM using their social
              networks. When it is disabled, users authenticate to RTM using their email and
              password.
            </p>
          </div>
        </div>
        <Divider />
        <div class="w-full flex flex-col gap-2 pt-2 pb-3">
          <div class="flex gap-1">
            <InputSwitch
              v-model="isEnabledMfaToAllUsers"
              inputId="isEnabledMfaToAllUsers"
            />
            <label
              class="text-color text-sm font-normal leading-5"
              for="isEnabledMfaToAllUsers"
              >Enforce Multi-Factor Authentication</label
            >
          </div>
          <div class="flex-col gap-1 pl-10">
            <p class="text-color-secondary text-sm font-normal">
              As an Account Owner you can enable/disable the enforce MFA functionality. MFA will be
              mandatory for all users of this account when enabling this item.
            </p>
          </div>
        </div>
      </div>
    </template>
  </FormHorizontal>
</template>
