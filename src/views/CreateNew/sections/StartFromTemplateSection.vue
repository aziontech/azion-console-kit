<script setup>
  import { ref, computed, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import InputText from 'primevue/inputtext'
  import Skeleton from 'primevue/skeleton'
  import { solutionService } from '@/services/v2/marketplace/solution-service'
  import { useAccountStore } from '@/stores/account'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'

  const router = useRouter()
  const searchQuery = ref('')

  // Inject selected template filters from parent component
  const selectedTemplateFilters = inject('selectedTemplateFilters', ref({}))

  // Get account store and feature flag
  const accountStore = useAccountStore()
  const isFlagBlockApiV4 = hasFlagBlockApiV4()

  // Get jobRole from account store
  const jobRole = accountStore.account?.jobRole

  // Build query params for recommended solutions
  const recommendedQueryParams = jobRole
    ? {
        group: 'recommended',
        type: isFlagBlockApiV4 ? jobRole : `${jobRole}-v4`
      }
    : {
        group: 'templates',
        type: isFlagBlockApiV4 ? 'onboarding' : 'onboarding-v4'
      }

  // Build query params for partners solutions
  const partnersQueryParams = {
    group: 'partners',
    type: isFlagBlockApiV4 ? 'partners' : 'partners-v4'
  }

  // Fetch recommended solutions
  const { data: recommendedTemplates, isLoading: isRecommendedLoading } =
    solutionService.useListSolutions(recommendedQueryParams)

  // Fetch partners solutions
  const { data: partnersTemplates, isLoading: isPartnersLoading } =
    solutionService.useListSolutions(partnersQueryParams)

  // Build template categories from fetched data
  const templateCategories = computed(() => {
    const categories = []

    // Add recommended templates category
    if (recommendedTemplates.value?.length) {
      categories.push({
        title: 'Recomended Templates',
        items: recommendedTemplates.value.map((template) => ({
          id: template.id,
          name: template.name,
          description: template.headline,
          icon: template.vendor?.icon || template.icon,
          vendor: template.vendor,
          slug: template.slug
        }))
      })
    }

    // Add partners templates category
    if (partnersTemplates.value?.length) {
      categories.push({
        title: 'Partners Templates',
        items: partnersTemplates.value.map((template) => ({
          id: template.id,
          name: template.name,
          description: template.headline,
          icon: template.vendor?.icon || template.icon,
          vendor: template.vendor,
          slug: template.slug
        }))
      })
    }

    return categories
  })

  // Helper to check if any filters are selected
  const hasActiveFilters = computed(() => {
    if (!selectedTemplateFilters.value) return false
    return Object.values(selectedTemplateFilters.value).some(
      (filters) => filters && filters.length > 0
    )
  })

  // Filter templates based on search query and selected filters
  const filteredCategories = computed(() => {
    let categories = templateCategories.value

    // Filter by selected template filters if any are selected
    if (hasActiveFilters.value) {
      categories = categories.map((category) => ({
        ...category,
        items: category.items.filter((item) => {
          // Check if template matches any of the selected filters
          // Template metadata fields that could match filters
          const templateMeta = item.meta || {}
          const templateFramework = item.framework || templateMeta.framework
          const templateUseCase = item.useCase || templateMeta.useCase
          const templateDatabase = item.database || templateMeta.database

          // Check frameworks filter
          const frameworksFilters = selectedTemplateFilters.value.frameworks || []
          const matchesFrameworks =
            frameworksFilters.length === 0 ||
            frameworksFilters.some((filterVal) => {
              const templateFrameworkLower = templateFramework?.toLowerCase() || ''
              return (
                templateFrameworkLower.includes(filterVal) ||
                filterVal.includes(templateFrameworkLower) ||
                item.name?.toLowerCase().includes(filterVal)
              )
            })

          // Check use cases filter
          const useCasesFilters = selectedTemplateFilters.value.useCases || []
          const matchesUseCases =
            useCasesFilters.length === 0 ||
            useCasesFilters.some((filterVal) => {
              const templateUseCaseLower = templateUseCase?.toLowerCase() || ''
              return (
                templateUseCaseLower.includes(filterVal) ||
                item.name?.toLowerCase().includes(filterVal) ||
                item.description?.toLowerCase().includes(filterVal)
              )
            })

          // Check databases filter
          const databasesFilters = selectedTemplateFilters.value.databases || []
          const matchesDatabases =
            databasesFilters.length === 0 ||
            databasesFilters.some((filterVal) => {
              const templateDatabaseLower = templateDatabase?.toLowerCase() || ''
              return (
                templateDatabaseLower.includes(filterVal) ||
                item.name?.toLowerCase().includes(filterVal) ||
                item.description?.toLowerCase().includes(filterVal)
              )
            })

          // If no filters are selected in a group, it passes
          // Template must match all non-empty filter groups
          const frameworkPass = frameworksFilters.length === 0 || matchesFrameworks
          const useCasePass = useCasesFilters.length === 0 || matchesUseCases
          const databasePass = databasesFilters.length === 0 || matchesDatabases

          return frameworkPass && useCasePass && databasePass
        })
      }))
    }

    // Filter by search query
    if (!searchQuery.value) {
      return categories.filter((category) => category.items.length > 0)
    }

    const query = searchQuery.value.toLowerCase()
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        )
      }))
      .filter((category) => category.items.length > 0)
  })

  // Handle template click navigation
  const handleTemplateClick = (template) => {
    router.push({
      name: 'create-something-new',
      params: {
        vendor: template.vendor?.slug,
        solution: template.slug
      }
    })
  }

  // Check if any data is loading
  const isLoading = computed(() => isRecommendedLoading.value || isPartnersLoading.value)
</script>

<template>
  <div class="flex-1 flex flex-col gap-6 min-w-0">
    <!-- Search Input -->
    <div class="w-full">
      <div
        class="w-full h-8 bg-surface-50 rounded-md shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05)] inline-flex justify-start items-center"
      >
        <div class="w-full h-8 py-1.5 flex justify-start items-center gap-2">
          <span
            class="flex flex-row p-input-icon-left items-center w-full"
            data-testid="template-search"
          >
            <i class="pi pi-search text-color-secondary" />
            <InputText
              class="h-8 w-full"
              v-model.trim="searchQuery"
              placeholder="Search on Templates..."
              data-testid="template-search-input"
            />
          </span>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div
      v-if="isLoading"
      class="flex flex-col gap-4"
    >
      <Skeleton
        width="200px"
        height="24px"
        class="mb-2"
      />
      <div class="flex flex-wrap gap-3">
        <Skeleton
          v-for="n in 6"
          :key="n"
          width="256px"
          height="144px"
          class="rounded"
        />
      </div>
    </div>

    <!-- Template Categories -->
    <template v-else>
      <div
        v-for="category in filteredCategories"
        :key="category.title"
        class="flex flex-col gap-4"
      >
        <!-- Category Header -->
        <div
          class="w-full h-6 pb-1 border-b surface-border inline-flex justify-between items-center"
        >
          <span class="text-xs font-normal text-color-secondary font-['Proto_Mono']">
            {{ category.title }}
          </span>
        </div>

        <!-- Template Cards Grid -->
        <div class="flex flex-wrap gap-3">
          <div
            v-for="template in category.items"
            :key="template.id"
            class="group w-64 h-36 p-4 bg-surface-50 border surface-border rounded hover:outline hover:outline-1 hover:outline-surface-100 flex justify-start items-start gap-2.5 overflow-hidden hover:outline-primary transition-all cursor-pointer"
            @click="handleTemplateClick(template)"
            data-testid="template-card"
          >
            <div class="flex-1 flex flex-col justify-start items-start gap-4">
              <!-- Template Icon -->
              <div class="w-full flex justify-between items-center">
                <img
                  class="w-9 h-9 rounded-sm object-contain"
                  :src="template.icon"
                  :alt="template.name"
                />

                <i
                  class="pi pi-external-link text-color-secondary text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                ></i>
              </div>

              <!-- Template Info -->
              <div class="flex flex-col gap-2">
                <span class="text-xs font-semibold text-color leading-3">
                  {{ template.name }}
                </span>
                <span class="text-xs font-normal text-color-secondary leading-4 line-clamp-2">
                  {{ template.description }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="filteredCategories.length === 0"
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <i class="pi pi-search text-4xl text-color-secondary mb-4"></i>
        <h3 class="text-sm font-semibold text-color mb-2">No templates found</h3>
        <p class="text-xs text-color-secondary max-w-md">
          Try adjusting your search query to find what you're looking for.
        </p>
      </div>
    </template>
  </div>
</template>
