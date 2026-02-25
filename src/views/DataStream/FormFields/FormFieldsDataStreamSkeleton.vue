<script setup>
  import {
    FormSectionSkeleton,
    FieldTextSkeleton,
    FieldDropdownSkeleton,
    FieldSwitchSkeleton,
    FieldGroupRadioSkeleton,
    FieldTextareaSkeleton
  } from '@/templates/form-skeleton'

  defineOptions({ name: 'form-fields-data-stream-skeleton' })
</script>

<template>
  <!-- General Section -->
  <FormSectionSkeleton
    titleWidth="5rem"
    :descriptionLines="2"
    :descriptionWidths="['100%', '70%']"
    data-testid="data-stream-skeleton__section__general"
  >
    <FieldTextSkeleton
      labelWidth="3rem"
      descriptionWidth="80%"
    />
  </FormSectionSkeleton>

  <!-- Input Section -->
  <FormSectionSkeleton
    titleWidth="3.5rem"
    :descriptionLines="1"
    :descriptionWidths="['90%']"
    data-testid="data-stream-skeleton__section__input"
  >
    <div class="flex flex-wrap gap-6">
      <FieldDropdownSkeleton
        labelWidth="6rem"
        descriptionWidth="85%"
      />
    </div>
  </FormSectionSkeleton>

  <!-- Transform Section -->
  <FormSectionSkeleton
    titleWidth="6rem"
    :descriptionLines="2"
    :descriptionWidths="['100%', '60%']"
    data-testid="data-stream-skeleton__section__transform"
  >
    <FieldGroupRadioSkeleton
      labelWidth="4rem"
      :optionCount="2"
    />
  </FormSectionSkeleton>

  <!-- Render Template Section -->
  <FormSectionSkeleton
    titleWidth="9rem"
    :descriptionLines="2"
    :descriptionWidths="['100%', '75%']"
    data-testid="data-stream-skeleton__section__render-template"
  >
    <div class="flex flex-wrap gap-6">
      <FieldDropdownSkeleton
        labelWidth="5rem"
        descriptionWidth="85%"
      />
    </div>
    <FieldTextareaSkeleton
      labelWidth="5rem"
      textareaHeight="300px"
      :showDescription="false"
    />
  </FormSectionSkeleton>

  <!-- Output Section -->
  <FormSectionSkeleton
    titleWidth="4.5rem"
    :descriptionLines="2"
    :descriptionWidths="['100%', '65%']"
    data-testid="data-stream-skeleton__section__output"
  >
    <FieldDropdownSkeleton
      labelWidth="5.5rem"
      descriptionWidth="80%"
    />
    <FieldTextSkeleton
      labelWidth="2.5rem"
      descriptionWidth="70%"
    />
    <FieldTextSkeleton
      labelWidth="8rem"
      descriptionWidth="90%"
    />
    <FieldTextSkeleton
      labelWidth="11rem"
      descriptionWidth="75%"
    />
  </FormSectionSkeleton>

  <!-- Status Section -->
  <FormSectionSkeleton
    titleWidth="4rem"
    :descriptionLines="0"
    data-testid="data-stream-skeleton__section__status"
  >
    <FieldSwitchSkeleton labelWidth="3.5rem" />
  </FormSectionSkeleton>
</template>
