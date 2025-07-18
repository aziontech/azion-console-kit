<template>
  <ListTableBlock
    ref="listPaymentMethodsRef"
    v-if="hasContentToList"
    :enableEditClick="false"
    isTabs
    :defaultOrderingFieldName="'is_default'"
    :apiFields="API_FIELDS"
    :columns="paymentsColumns"
    :listService="listCreditCards"
    @on-load-data="handleLoadData"
    :actions="actionsRow"
    emptyListMessage="No payment method found."
  >
    <template #addButton>
      <div class="flex gap-4">
        <PrimeButton
          icon="pi pi-plus"
          label="Credit"
          size="small"
          @click="openDrawerAddCreditWithValidation"
          data-testid="payment-methods__add-credit__button"
          outlined
        />
        <PrimeButton
          icon="pi pi-plus"
          data-testid="payment-methods__add-payment-method__button"
          severity="secondary"
          size="small"
          @click="openDrawerPaymentMethod"
          label="Payment Method"
        />
      </div>
    </template>
  </ListTableBlock>
  <EmptyResultsBlock
    v-else
    title="No payment method has been added"
    description="Click the button below to add a payment method."
    createButtonLabel="Payment Method"
    inTabs
    @click-to-create="openDrawerPaymentMethod"
    :documentationService="props.documentPaymentMethodService"
  >
    <template #illustration>
      <Illustration />
    </template>
  </EmptyResultsBlock>
</template>

<script setup>
  import Illustration from '@/assets/svg/illustration-layers.vue'
  import EmptyResultsBlock from '@/templates/empty-results-block'
  import { columnBuilder } from '@/templates/list-table-block/columns/column-builder'
  import ListTableBlock from '@templates/list-table-block'
  import PrimeButton from 'primevue/button'
  import { useToast } from 'primevue/usetoast'
  import { paymentService } from '@/services/v2'

  import { ref } from 'vue'
  const emit = defineEmits([
    'update-credit-event',
    'openDrawerAddCredit',
    'openDrawerAddPaymentMethod'
  ])
  const hasContentToList = ref(true)
  const toast = useToast()

  const props = defineProps({
    documentPaymentMethodService: {
      type: Function,
      required: true
    },
    cardDefault: {
      type: Object,
      required: true
    },
    getStripeClientService: {
      type: Function,
      required: true
    }
  })

  const listCreditCards = async (params) => {
    const { body } = await paymentService.listCreditCards({
      ...params,
      pageSize: 200
    })
    return body
  }

  const listPaymentMethodsRef = ref('')

  const openDrawerAddCreditWithValidation = () => {
    if (props.cardDefault.cardData) {
      emit('openDrawerAddCredit')
    }
  }

  const openDrawerPaymentMethod = () => {
    emit('openDrawerAddPaymentMethod')
  }

  const API_FIELDS = [
    'id',
    'card_holder',
    'card_brand',
    'card_expiration_month',
    'card_expiration_year',
    'is_default',
    'card_last_4_digits'
  ]

  const paymentsColumns = ref([
    {
      field: 'cardData',
      header: 'Card Number',
      sortField: 'cardNumberSearch',
      filterPath: 'cardNumberSearch',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'credit-card-column' })
    },
    {
      field: 'cardHolder',
      header: 'Card Holder',
      sortField: 'cardHolder'
    },
    {
      field: 'cardExpiration',
      header: 'Expiration Date',
      sortField: 'expiringDateByOrder',
      filterPath: 'expiringDateSearch',
      type: 'component',
      component: (columnData) =>
        columnBuilder({ data: columnData, columnAppearance: 'text-with-tag' })
    }
  ])

  const handleLoadData = (event) => {
    hasContentToList.value = event
  }

  const showToast = (severity, detail) => {
    if (!detail) return
    const options = {
      closable: true,
      severity,
      summary: severity,
      detail
    }

    toast.add(options)
  }

  const setPaymentAsDefault = async (payment) => {
    try {
      await paymentService.editCreditCard(payment.id, {
        is_default: true
      })
      showToast('success', 'Payment Method successfully set as default')
      emit('update-credit-event')
      reloadList()
    } catch (error) {
      if (error && typeof error.showErrors === 'function') {
        error.showErrors(toast)
      } else {
        showToast('error', 'Error', error)
      }
    }
  }

  const actionsRow = ref([
    {
      label: 'Set as default',
      type: 'action',
      icon: 'pi pi-fw pi-check-circle',
      commandAction: async (item) => {
        await setPaymentAsDefault(item)
      }
    },
    {
      label: 'Delete',
      type: 'delete',
      icon: 'pi pi-fw pi-trash',
      title: 'Payment Method',
      disabled: (item) => item.isDefault,
      service: paymentService.deleteCreditCard
    }
  ])

  const reloadList = () => {
    if (hasContentToList.value) {
      listPaymentMethodsRef.value.reload()
      return
    }
    hasContentToList.value = true
  }

  defineExpose({
    reloadList
  })
</script>
