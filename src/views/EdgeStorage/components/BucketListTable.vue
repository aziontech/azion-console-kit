<template>
  <ListTableBlock
    ref="listServiceRef"
    :listService="loadBuckets"
    :columns="columns"
    :actions="actions"
    :apiFields="fields"
    defaultOrderingFieldName="-lastModified"
    enableEditClick
    editPagePath="/object-storage"
    exportFileName="Buckets"
    class="w-full"
    :isLoading="isLoading"
    :emptyBlock="{
      title: 'No buckets created',
      description: 'Create your first bucket here',
      createButtonLabel: 'Bucket',
      createPagePath: '/object-storage/create',
      documentationService: documentationGuideProducts.edgeStorage
    }"
    @force-update="bucketTableNeedRefresh = true"
  />
</template>

<script setup>
  import { ref } from 'vue'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { documentationGuideProducts } from '@/helpers/azion-documentation-catalog'
  import { useRouter, useRoute } from 'vue-router'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const router = useRouter()
  const route = useRoute()
  const { buckets, bucketTableNeedRefresh, selectedBucket } = useEdgeStorage()
  const fields = ['name', 'size', 'last_editor', 'last_modified', 'workloads_access']
  const columns = [
    {
      field: 'name',
      header: 'Name',
      sortable: true,
      type: 'component',
      style: 'max-width: 300px',
      component: (columnData) => {
        return columnBuilder({
          data: columnData,
          columnAppearance: 'text-format-with-popup'
        })
      }
    },
    {
      field: 'size',
      header: 'Size',
      sortable: true
    },
    {
      field: 'lastEditor',
      header: 'Last Editor',
      sortField: 'last_editor',
      filterPath: 'last_editor'
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortField: 'lastModified',
      filterPath: 'lastModified'
    }
  ]

  const listServiceRef = ref(null)

  const isLoading = ref(true)

  const handleEdit = (bucket) => {
    selectedBucket.value = bucket
    router.push(`/object-storage/${bucket.name}/edit/main-settings`)
  }

  const handleDeleteBucket = async (data) => {
    bucketTableNeedRefresh.value = true
    await edgeStorageService.deleteEdgeStorageBucket(data)
    listServiceRef.value.reload()
  }
  const actions = [
    {
      type: 'action',
      label: 'Edit',
      icon: 'pi pi-pencil',
      commandAction: handleEdit
    },
    {
      type: 'delete',
      label: 'Delete',
      icon: 'pi pi-trash',
      service: (data) => handleDeleteBucket(data)
    }
  ]

  const loadBuckets = async (params) => {
    try {
      isLoading.value = true

      const listBucketsResponse = await edgeStorageService.listEdgeStorageBuckets(params)

      buckets.value = listBucketsResponse.body
      const bucketCount = listBucketsResponse.count

      buckets.value.forEach((bucket) => {
        bucket.size = '-'
      })

      bucketTableNeedRefresh.value = false

      if (route.params?.id) {
        const bucketName = buckets.value.find((bucket) => bucket.name === route.params.id)
        if (bucketName) {
          selectedBucket.value = bucketName
        }
      }

      edgeStorageService
        .getEdgeStorageMetrics()
        .then((metricsResponse) => {
          buckets.value.forEach((bucket) => {
            const size = metricsResponse.find(
              (metric) => metric.bucketName === bucket.name
            )?.storedGb
            bucket.size = size ? `${size} GB` : '-'
          })
        })
        .catch(() => {})

      return {
        body: buckets.value,
        count: bucketCount
      }
    } finally {
      isLoading.value = false
    }
  }
</script>
