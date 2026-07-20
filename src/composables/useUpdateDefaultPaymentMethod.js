import { computed } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { serviceOrdersService } from '@/services/v2/service-orders/service-orders-service'
import { queryKeys } from '@/services/v2/base/query/queryKeys'

export function useUpdateDefaultPaymentMethod() {
  const queryClient = useQueryClient()

  const createSetupIntentMutation = useMutation({
    mutationFn: () => serviceOrdersService.createPaymentMethodSetupIntent()
  })

  const setDefaultMutation = useMutation({
    mutationFn: (paymentMethodId) => serviceOrdersService.setDefaultPaymentMethod(paymentMethodId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.serviceOrders.billingPaymentMethods()
      })
    }
  })

  const createSetupIntent = () => createSetupIntentMutation.mutateAsync()
  const setDefault = (paymentMethodId) => setDefaultMutation.mutateAsync(paymentMethodId)

  return {
    createSetupIntent,
    setDefault,
    isWorking: computed(
      () => createSetupIntentMutation.isPending.value || setDefaultMutation.isPending.value
    )
  }
}
