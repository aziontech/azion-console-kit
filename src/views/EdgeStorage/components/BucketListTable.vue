<template>
  <ListTableBlock
    ref="listServiceRef"
    :listService="loadBuckets"
    :columns="columns"
    :actions="actions"
    :apiFields="fields"
    addButtonLabel="Bucket"
    defaultOrderingFieldName="-lastModified"
    createPagePath="/object-storage/create"
    enableEditClick
    editPagePath="/object-storage"
    exportFileName="buckets"
    class="w-full"
    :isLoading="isLoading"
    :emptyBlock="{
      title: 'No buckets created',
      description: 'Create your first bucket here',
      createButtonLabel: 'Bucket',
      createPagePath: '/object-storage/create',
      documentationService: documentationGuideProducts.edgeStorage
    }"
  />
</template>

<script setup>
  import { ref } from 'vue'
  import ListTableBlock from '@/templates/list-table-block/with-fetch-ordering-and-pagination.vue'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { documentationGuideProducts } from '@/helpers/azion-documentation-catalog'
  import { useRouter, useRoute } from 'vue-router'

  /**@type {import('@/plugins/analytics/AnalyticsTrackerAdapter').AnalyticsTrackerAdapter} */
  const router = useRouter()
  const route = useRoute()
  const { buckets, bucketTableNeedRefresh, selectedBucket } = useEdgeStorage()
  const fields = ['name', 'size', 'last_editor', 'last_modified']
  const columns = [
    {
      field: 'name',
      header: 'Name',
      sortable: true
    },
    {
      field: 'size',
      header: 'Size',
      sortable: true
    },
    {
      field: 'lastEditor',
      header: 'Last Editor',
      sortable: true
    },
    {
      field: 'lastModified',
      header: 'Last Modified',
      sortable: true
    }
  ]

  const listServiceRef = ref(null)

  const isLoading = ref(true)

  const handleEdit = (bucket) => {
    router.push(`/object-storage/edit/${bucket.name}`)
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

  const loadBuckets = async () => {
    try {
      isLoading.value = true
      if (!buckets.value.length || bucketTableNeedRefresh.value) {
        const [listBucketsResponse, metricsResponse] = await Promise.all([
          edgeStorageService.listEdgeStorageBuckets(),
          edgeStorageService.getEdgeStorageMetrics()
        ])
        buckets.value = listBucketsResponse.body
        buckets.value.forEach((bucket) => {
          const size = metricsResponse.find((metric) => metric.bucketName === bucket.name)?.storedGb
          bucket.size = size ? `${size} GB` : '-'
        })
        bucketTableNeedRefresh.value = false
        if (route.params?.id) {
          const bucketName = buckets.value.find((bucket) => bucket.name === route.params.id)
          if (bucketName) {
            selectedBucket.value = bucketName
          }
        }
      }
      return {
        body: buckets.value,
        count: buckets.value.length
      }
    } finally {
      isLoading.value = false
    }
  }
</script>
