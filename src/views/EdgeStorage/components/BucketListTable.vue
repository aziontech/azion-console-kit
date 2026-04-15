<script setup>
  import { ref } from 'vue'
  import ListTable from '@/components/list-table/ListTable.vue'
  import { edgeStorageService } from '@/services/v2/edge-storage/edge-storage-service'
  import { useEdgeStorage } from '@/composables/useEdgeStorage'
  import { documentationGuideProducts } from '@/helpers/azion-documentation-catalog'
  import { useRouter, useRoute } from 'vue-router'
  import { columnBuilder } from '@/components/list-table/columns/column-builder'

  const router = useRouter()
  const route = useRoute()
  const { buckets, bucketTableNeedRefresh, selectedBucket } = useEdgeStorage()
  const fields = ['name', 'size', 'last_editor', 'last_modified', 'workloads_access']
  const listTableRef = ref(null)

  const bucketColumns = [
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

  const handleEdit = (bucket) => {
    selectedBucket.value = bucket
    router.push(`/object-storage/${bucket.name}/edit/main-settings`)
  }

  const handleDeleteBucket = async (data) => {
    bucketTableNeedRefresh.value = true
    await edgeStorageService.deleteEdgeStorageBucket(data)
    listTableRef.value?.reload()
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

  const handleNavigateToCreate = () => {
    router.push('/object-storage/create')
  }

  const loadBuckets = async (params) => {
    try {
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
    } catch {
      return { body: [], count: 0 }
    }
  }
</script>

<template>
  <ListTable
    ref="listTableRef"
    :listService="loadBuckets"
    :columns="bucketColumns"
    :actions="actions"
    :apiFields="fields"
    :frozenColumns="['name']"
    editPagePath="/object-storage"
    defaultOrderingFieldName="-last_modified"
    exportFileName="Buckets"
    emptyListMessage="No buckets found."
    :emptyBlock="{
      title: 'No Buckets yet',
      description: 'Create your first bucket to store, organize, and access data.',
      createButtonLabel: 'Bucket',
      documentationService: documentationGuideProducts.edgeStorage
    }"
    @force-update="bucketTableNeedRefresh = true"
    @click-to-create="handleNavigateToCreate"
  />
</template>
