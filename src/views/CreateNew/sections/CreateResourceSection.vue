<script setup>
  import { ref, computed, inject } from 'vue'
  import { useRouter } from 'vue-router'
  import InputText from 'primevue/inputtext'
  import { hasFlagBlockApiV4 } from '@/composables/user-flag'
  import TEXT_DOMAIN_WORKLOAD from '@/helpers/handle-text-workload-domain-flag'

  const router = useRouter()
  const searchQuery = ref('')

  // Inject selected categories from parent component
  const selectedCategories = inject('selectedCategories', ref([]))

  // Get the workload/domain text based on v4 flag
  const domainWorkloadText = TEXT_DOMAIN_WORKLOAD()
  const isFlagBlockApiV4 = hasFlagBlockApiV4()

  // Resource categories with their items
  const resourceCategories = [
    {
      title: 'Build',
      items: [
        {
          id: 'workload',
          name: domainWorkloadText.singularTitle,
          description: isFlagBlockApiV4
            ? 'Configure domains for your applications.'
            : 'Implement serverless functions and scalable applications.',
          route: isFlagBlockApiV4 ? '/domains/create' : '/workloads/create'
        },
        {
          id: 'application',
          name: 'Application',
          description: 'Boost performance, enhance delivery.',
          route: '/applications/create'
        },
        {
          id: 'orchestrator',
          name: 'Orchestrator',
          description: 'Deploy, manage, monitor and automate edge workloads.',
          route: '/edge-node'
        },
        {
          id: 'variable',
          name: 'Variable',
          description: 'Store and manage key-value pairs for your applications.',
          route: '/variables/create'
        },
        {
          id: 'function',
          name: 'Function',
          description: 'Run serverless functions at the edge.',
          route: '/functions/create'
        }
      ]
    },
    {
      title: 'Store',
      items: [
        {
          id: 'sql-database',
          name: 'SQL Database',
          description: 'Store relational and structured data.',
          route: '/sql-database/create'
        },
        {
          id: 'object-storage',
          name: 'Object Storage',
          description: 'Store unstructured data in scalable way.',
          route: '/object-storage'
        }
      ]
    },
    {
      title: 'Secure',
      items: [
        {
          id: 'firewall',
          name: 'Firewall',
          description: 'Defend, prevent network level attacks.',
          route: '/firewalls/create'
        },
        {
          id: 'waf',
          name: 'Web Application Firewall (WAF)',
          description: 'Protect apps, block vulnerabilities.',
          route: '/waf/create'
        },
        {
          id: 'edge-dns',
          name: 'Edge DNS',
          description: 'Resolve DNS quickly and securely.',
          route: '/edge-dns/create'
        },
        {
          id: 'server-certificate',
          name: 'Server Certificate',
          description: 'Ensure secure connection to domains.',
          route: '/digital-certificates/create'
        },
        {
          id: 'trusted-certificate',
          name: 'Trusted Certificate',
          description: 'Ensure secure connection to domains.',
          route: '/digital-certificates/create'
        },
        {
          id: 'revocation-list',
          name: 'Revocation List',
          description: 'Ensure secure connection to domains.',
          route: '/digital-certificates/create'
        }
      ]
    },
    {
      title: 'Observe',
      items: [
        {
          id: 'data-stream',
          name: 'Data Stream',
          description: 'Stream data for real-time analysis.',
          route: '/data-stream/create'
        },
        {
          id: 'edge-pulse',
          name: 'Edge Pulse',
          description: 'Monitor, optimize edge perfomance.',
          route: '/edge-pulse'
        }
      ]
    }
  ]

  // Helper function to normalize category title to match filter value
  const getCategoryFilterValue = (title) => {
    return title.toLowerCase()
  }

  // Filter resources based on search query and selected categories
  const filteredCategories = computed(() => {
    let categories = resourceCategories

    // Filter by selected categories if any are selected
    if (selectedCategories.value && selectedCategories.value.length > 0) {
      categories = categories.filter((category) =>
        selectedCategories.value.includes(getCategoryFilterValue(category.title))
      )
    }

    // Filter by search query
    if (!searchQuery.value) {
      return categories
    }

    const query = searchQuery.value.toLowerCase()
    return categories
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        )
      }))
      .filter((category) => category.items.length > 0)
  })

  // Handle resource click navigation
  const handleResourceClick = (resource) => {
    router.push(resource.route)
  }
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6 min-w-0 w-full">
    <!-- Search Input -->
    <div class="w-full">
      <div
        class="w-full h-8 bg-surface-50 rounded-md shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05)] inline-flex justify-start items-center"
      >
        <div class="w-full h-8 py-1.5 flex justify-start items-center gap-2">
          <span
            class="flex flex-row p-input-icon-left items-center w-full"
            data-testid="data-table-search"
          >
            <i class="pi pi-search" />
            <InputText
              class="h-8 w-full"
              v-model.trim="searchQuery"
              data-testid="data-table-search-input"
              placeholder="Search on Resources..."
            />
          </span>
        </div>
      </div>
    </div>

    <!-- Resource Categories Grid - Responsive -->
    <div
      class="grid gap-4 sm:gap-3"
      :class="
        filteredCategories.length === 1
          ? 'grid-cols-1'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
      "
    >
      <div
        v-for="category in filteredCategories"
        :key="category.title"
        class="flex flex-col justify-start items-start gap-1.5 rounded-md"
        :class="{ 'col-span-full': category.items.length === 1 }"
      >
        <!-- Category Header -->
        <div class="self-stretch px-3 sm:px-4 pt-3 sm:pt-4 pb-2 border-b surface-border">
          <span class="text-xs font-normal text-color-secondary font-['Proto_Mono']">
            {{ category.title }}
          </span>
        </div>

        <!-- Category Items -->
        <div
          class="flex justify-start items-start pb-2 w-full"
          :class="filteredCategories.length === 1 ? 'flex-row' : 'flex-col'"
        >
          <button
            v-for="item in category.items"
            :key="item.id"
            class="self-stretch px-3 sm:px-4 py-2.5 sm:py-3 hover:surface-100 transition-colors inline-flex justify-start items-start gap-2.5 overflow-hidden cursor-pointer text-left w-full"
            :class="{ 'max-w-[236px]': filteredCategories.length === 1 }"
            @click="handleResourceClick(item)"
          >
            <div class="flex-1 inline-flex flex-col justify-start items-start gap-1.5 sm:gap-2">
              <span class="text-xs font-semibold text-color leading-3">
                {{ item.name }}
              </span>
              <span
                class="self-stretch text-xs font-normal text-color-secondary leading-4 line-clamp-2"
              >
                {{ item.description }}
              </span>
            </div>
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-if="!filteredCategories.length"
        class="col-span-full flex flex-col items-center justify-center py-12 text-center"
      >
        <i class="pi pi-search text-4xl text-color-secondary mb-4"></i>
        <h3 class="text-sm font-semibold text-color mb-2">No resources found</h3>
        <p class="text-xs text-color-secondary max-w-md">
          Try adjusting your search query to find what you're looking for.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
