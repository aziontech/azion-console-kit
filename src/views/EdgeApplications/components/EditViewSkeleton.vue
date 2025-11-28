<template>
  <section class="w-full flex flex-col flex-1 relative">
    <section class="w-full flex flex-col flex-1 px-8 pt-4 pb-8">
      <!-- Page Heading Skeleton -->
      <div class="w-full flex-col justify-center items-start inline-flex">
        <!-- Breadcrumbs -->
        <div class="flex gap-2 items-center -ml-1.5">
          <Skeleton
            width="3rem"
            height="0.875rem"
          />
          <span class="text-color-secondary">/</span>
          <Skeleton
            width="7rem"
            height="0.875rem"
          />
          <span class="text-color-secondary">/</span>
          <Skeleton
            width="10rem"
            height="0.875rem"
          />
        </div>

        <!-- Title -->
        <div class="flex w-full py-4 items-center">
          <Skeleton
            width="15rem"
            height="2rem"
          />
        </div>
      </div>

      <!-- Content Area -->
      <div class="h-full flex flex-1 flex-col mt-4">
        <!-- Tabs Skeleton -->
        <div class="flex gap-4 surface-border mb-6">
          <Skeleton
            width="8rem"
            height="2.5rem"
            class="mb-[-1px]"
          />
          <Skeleton
            width="6rem"
            height="2.5rem"
            class="mb-[-1px]"
          />
          <Skeleton
            width="10rem"
            height="2.5rem"
            class="mb-[-1px]"
          />
          <Skeleton
            width="9rem"
            height="2.5rem"
            class="mb-[-1px]"
          />
          <Skeleton
            width="8rem"
            height="2.5rem"
            class="mb-[-1px]"
          />
          <Skeleton
            width="11rem"
            height="2.5rem"
            class="mb-[-1px]"
          />
          <Skeleton
            width="8rem"
            height="2.5rem"
            class="mb-[-1px]"
          />
        </div>

        <!-- Form Content -->
        <div class="flex flex-col gap-8 mt-4">
          <!-- General Block - Horizontal Layout -->
          <fieldset
            class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section px-8 py-8 rounded-md lg:flex-nowrap xl:py-14 xl:p-14 lg:gap-16 border surface-border"
          >
            <!-- Left: Title and Description -->
            <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[15rem]">
              <Skeleton
                width="5rem"
                height="1.75rem"
                class="mb-2"
              />
              <Skeleton
                width="100%"
                height="1rem"
              />
              <Skeleton
                width="80%"
                height="1rem"
              />
            </div>

            <!-- Right: Input -->
            <div class="max-w-3xl w-full flex flex-col gap-8">
              <div class="flex flex-col sm:max-w-lg w-full gap-2">
                <Skeleton
                  width="3rem"
                  height="1rem"
                  class="mb-1"
                />
                <Skeleton
                  width="100%"
                  height="2.75rem"
                  borderRadius="6px"
                />
                <Skeleton
                  width="90%"
                  height="0.875rem"
                />
              </div>
            </div>
          </fieldset>

          <!-- Modules Block - Horizontal Layout -->
          <fieldset
            class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section px-8 py-8 rounded-md lg:flex-nowrap xl:py-14 xl:p-14 lg:gap-16 border surface-border"
          >
            <!-- Left: Title and Description -->
            <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[15rem]">
              <Skeleton
                width="7rem"
                height="1.75rem"
                class="mb-2"
              />
              <Skeleton
                width="100%"
                height="1rem"
              />
              <Skeleton
                width="90%"
                height="1rem"
              />
              <Skeleton
                width="60%"
                height="1rem"
              />
            </div>

            <!-- Right: Switches -->
            <div class="max-w-3xl w-full flex flex-col gap-8">
              <!-- Default Modules Label -->
              <div class="flex flex-col gap-2">
                <Skeleton
                  width="10rem"
                  height="1.25rem"
                  class="mb-3"
                />

                <!-- Module Cards -->
                <div
                  v-for="i in 4"
                  :key="i"
                  class="surface-border border-round p-4 mb-3"
                  style="border: 1px solid var(--surface-border)"
                >
                  <div class="flex align-items-center justify-content-between">
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

                <!-- Subscription Section -->
                <div class="flex flex-col gap-2 mt-4">
                  <Skeleton
                    width="12rem"
                    height="1.25rem"
                    class="mb-2"
                  />
                  <Skeleton
                    width="9rem"
                    height="2.5rem"
                    borderRadius="6px"
                  />
                </div>
              </div>
            </div>
          </fieldset>

          <!-- Debug Rules Block - Horizontal Layout -->
          <fieldset
            class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section px-8 py-8 rounded-md lg:flex-nowrap xl:py-14 xl:p-14 lg:gap-16 border surface-border"
          >
            <!-- Left: Title and Description -->
            <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[15rem]">
              <Skeleton
                width="8rem"
                height="1.75rem"
                class="mb-2"
              />
              <Skeleton
                width="100%"
                height="1rem"
              />
              <Skeleton
                width="95%"
                height="1rem"
              />
              <Skeleton
                width="85%"
                height="1rem"
              />
            </div>

            <!-- Right: Switch -->
            <div class="max-w-3xl w-full flex flex-col gap-8">
              <div class="flex align-items-center justify-content-between">
                <div class="flex flex-col gap-2 flex-1">
                  <Skeleton
                    width="4rem"
                    height="1rem"
                  />
                  <Skeleton
                    width="90%"
                    height="0.875rem"
                  />
                  <Skeleton
                    width="80%"
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
            </div>
          </fieldset>

          <!-- Status Block - Horizontal Layout -->
          <fieldset
            class="flex max-w-screen-2xl-test mx-auto gap-8 w-full surface-section px-8 py-8 rounded-md lg:flex-nowrap xl:py-14 xl:p-14 lg:gap-16 border surface-border"
          >
            <!-- Left: Title and Description -->
            <div class="flex flex-col gap-2 flex-1 w-full md:min-w-[15rem]">
              <Skeleton
                width="5rem"
                height="1.75rem"
                class="mb-2"
              />
            </div>

            <!-- Right: Switch -->
            <div class="max-w-3xl w-full flex flex-col gap-8">
              <div class="flex align-items-center justify-content-between">
                <div class="flex flex-col gap-2">
                  <Skeleton
                    width="4rem"
                    height="1rem"
                  />
                </div>
                <Skeleton
                  width="3rem"
                  height="1.5rem"
                  borderRadius="12px"
                  class="ml-4"
                />
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </section>
  </section>
</template>

<script setup>
  import Skeleton from 'primevue/skeleton'

  defineOptions({ name: 'edit-view-skeleton' })
</script>
