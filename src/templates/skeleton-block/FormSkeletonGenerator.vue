<template>
  <div class="w-full grow flex flex-col gap-8 max-md:gap-6 mt-4">
    <fieldset
      v-for="(block, blockIndex) in config"
      :key="blockIndex"
      class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section px-8 py-8 rounded-md flex-wrap min-w-[2rem] lg:flex-nowrap xl:py-14 xl:p-14 lg:gap-16 border surface-border"
    >
      <!-- Left side: title + description -->
      <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[15rem]">
        <Skeleton
          :width="block.titleWidth || '5rem'"
          height="1.75rem"
          class="mb-2"
        />
        <Skeleton
          v-for="(descWidth, descIndex) in block.descriptionWidths || ['100%', '80%']"
          :key="descIndex"
          :width="descWidth"
          height="1rem"
        />
      </div>

      <!-- Right side: fields -->
      <div class="max-w-3xl w-full flex flex-col gap-8 max-md:gap-6">
        <template
          v-for="(field, fieldIndex) in block.fields"
          :key="fieldIndex"
        >
          <!-- Input -->
          <div
            v-if="field.type === 'input'"
            class="flex flex-col w-full gap-2"
            :class="field.maxWidth || 'sm:max-w-lg'"
          >
            <Skeleton
              :width="field.labelWidth || '5rem'"
              height="1rem"
              class="mb-1"
            />
            <Skeleton
              width="100%"
              :height="field.inputHeight || '2.75rem'"
              borderRadius="6px"
            />
            <Skeleton
              v-if="field.hasHelper"
              width="90%"
              height="0.875rem"
            />
          </div>

          <!-- Textarea -->
          <div
            v-else-if="field.type === 'textarea'"
            class="flex flex-col w-full gap-2"
            :class="field.maxWidth || ''"
          >
            <Skeleton
              :width="field.labelWidth || '5rem'"
              height="1rem"
              class="mb-1"
            />
            <Skeleton
              width="100%"
              :height="field.inputHeight || '6rem'"
              borderRadius="6px"
            />
          </div>

          <!-- Switch (inline: toggle + label) -->
          <div
            v-else-if="field.type === 'switch'"
            class="flex items-center gap-3"
          >
            <Skeleton
              width="3rem"
              height="1.5rem"
              borderRadius="12px"
            />
            <div
              v-if="field.descriptionWidth"
              class="flex flex-col gap-1"
            >
              <Skeleton
                :width="field.labelWidth || '10rem'"
                height="1rem"
              />
              <Skeleton
                :width="field.descriptionWidth"
                height="0.75rem"
              />
            </div>
            <Skeleton
              v-else
              :width="field.labelWidth || '10rem'"
              height="1rem"
            />
          </div>

          <!-- Switch justified (label+desc left, toggle right) -->
          <div
            v-else-if="field.type === 'switch-justified'"
            class="flex items-center justify-between"
          >
            <div class="flex flex-col gap-2 flex-1">
              <Skeleton
                :width="field.labelWidth || '7rem'"
                height="1rem"
              />
              <Skeleton
                v-if="field.descriptionWidth"
                :width="field.descriptionWidth"
                height="0.875rem"
              />
            </div>
            <Skeleton
              width="3rem"
              height="1.5rem"
              borderRadius="12px"
              class="ml-4"
            />
          </div>

          <!-- Radio group -->
          <div
            v-else-if="field.type === 'radio'"
            class="flex flex-col gap-2"
          >
            <Skeleton
              v-if="field.labelWidth"
              :width="field.labelWidth"
              height="1rem"
              class="mb-2"
            />
            <div class="flex flex-col gap-3">
              <div
                v-for="radioIndex in field.count || 2"
                :key="radioIndex"
                class="flex items-start gap-2"
              >
                <Skeleton
                  width="1.25rem"
                  height="1.25rem"
                  borderRadius="50%"
                  class="flex-shrink-0 mt-0.5"
                />
                <div class="flex flex-col gap-1">
                  <Skeleton
                    :width="field.optionLabelWidth || '10rem'"
                    height="1rem"
                  />
                  <Skeleton
                    v-if="field.optionDescWidth"
                    :width="field.optionDescWidth"
                    height="0.875rem"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Radio cards (full-width clickable cards) -->
          <div
            v-else-if="field.type === 'radio-cards'"
            class="flex flex-col gap-3"
          >
            <Skeleton
              v-for="cardIndex in field.count || 2"
              :key="cardIndex"
              width="100%"
              height="3.5rem"
              borderRadius="6px"
            />
          </div>

          <!-- Module cards (label + desc + toggle) -->
          <div
            v-else-if="field.type === 'module-cards'"
            class="flex flex-col gap-2"
          >
            <Skeleton
              v-if="field.labelWidth"
              :width="field.labelWidth"
              height="1.25rem"
              class="mb-3"
            />
            <div
              v-for="moduleIndex in field.count || 4"
              :key="moduleIndex"
              class="border-round p-4 mb-3"
              style="border: 1px solid var(--surface-border)"
            >
              <div class="flex items-center justify-between">
                <div class="flex flex-col gap-2 flex-1">
                  <Skeleton
                    width="12rem"
                    height="1.125rem"
                  />
                  <Skeleton
                    width="85%"
                    height="0.875rem"
                  />
                </div>
                <Skeleton
                  width="3rem"
                  height="1.5rem"
                  borderRadius="12px"
                />
              </div>
            </div>
          </div>

          <!-- Input row (multiple inputs side by side) -->
          <div
            v-else-if="field.type === 'input-row'"
            class="flex gap-6 max-sm:flex-col"
          >
            <div
              v-for="(input, inputIndex) in field.inputs"
              :key="inputIndex"
              class="flex flex-col w-full gap-2"
              :class="input.maxWidth || 'sm:max-w-xs'"
            >
              <Skeleton
                :width="input.labelWidth || '5rem'"
                height="1rem"
              />
              <Skeleton
                width="100%"
                :height="input.inputHeight || '2.75rem'"
                borderRadius="6px"
              />
              <Skeleton
                v-if="input.hasHelper"
                width="90%"
                height="0.875rem"
              />
            </div>
          </div>
        </template>
      </div>
    </fieldset>
  </div>
</template>

<script setup>
  import Skeleton from '@aziontech/webkit/skeleton'

  defineOptions({ name: 'form-skeleton-generator' })

  defineProps({
    config: {
      type: Array,
      required: true
    }
  })
</script>
