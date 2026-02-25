<script setup>
  import {
    FormSectionSkeleton,
    FieldTextSkeleton,
    FieldDropdownSkeleton,
    FieldSwitchSkeleton
  } from '@/templates/form-skeleton'
  import Skeleton from 'primevue/skeleton'

  defineOptions({ name: 'form-fields-your-settings-skeleton' })
</script>

<template>
  <!-- Profile Section -->
  <FormSectionSkeleton
    titleWidth="4rem"
    :descriptionLines="1"
    :descriptionWidths="['90%']"
    data-testid="your-settings-skeleton__section__profile"
  >
    <FieldTextSkeleton
      labelWidth="5rem"
      descriptionWidth="70%"
    />
    <FieldTextSkeleton
      labelWidth="5rem"
      descriptionWidth="65%"
    />
    <div class="flex sm:flex-row w-full flex-col gap-6">
      <FieldDropdownSkeleton
        labelWidth="5rem"
        descriptionWidth="60%"
      />
      <FieldDropdownSkeleton
        labelWidth="5rem"
        descriptionWidth="80%"
      />
    </div>
  </FormSectionSkeleton>

  <!-- Contact Information Section -->
  <FormSectionSkeleton
    titleWidth="10rem"
    :descriptionLines="1"
    :descriptionWidths="['85%']"
    data-testid="your-settings-skeleton__section__contact"
  >
    <FieldTextSkeleton
      labelWidth="3rem"
      descriptionWidth="55%"
    />
    <div class="flex flex-col w-full gap-2">
      <Skeleton
        width="6.5rem"
        height="1rem"
        class="mb-1"
      />
      <div class="flex sm:flex-row flex-col gap-4">
        <Skeleton
          width="8rem"
          height="2.75rem"
          borderRadius="6px"
        />
        <Skeleton
          width="100%"
          height="2.75rem"
          borderRadius="6px"
          class="flex-1"
        />
      </div>
      <Skeleton
        width="85%"
        height="0.875rem"
      />
    </div>
  </FormSectionSkeleton>

  <!-- Security Settings Section -->
  <FormSectionSkeleton
    titleWidth="8.5rem"
    :descriptionLines="2"
    :descriptionWidths="['100%', '85%']"
    data-testid="your-settings-skeleton__section__security"
  >
    <FieldTextSkeleton
      labelWidth="6rem"
      :showDescription="false"
    />
    <FieldTextSkeleton
      labelWidth="7rem"
      :showDescription="false"
    />
    <FieldTextSkeleton
      labelWidth="8.5rem"
      :showDescription="false"
    />
    <FieldSwitchSkeleton
      labelWidth="13rem"
      showDescription
    />
  </FormSectionSkeleton>
</template>
