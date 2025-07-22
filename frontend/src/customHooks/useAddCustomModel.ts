import { ModelProviderType } from '@types'

import { useAuthentication } from './useAuthentication'
import { useFetchUtils } from './useFetchUtils'

export const useAddCustomModel = () => {
  const { post } = useFetchUtils()
  const { getUserName } = useAuthentication()

  const addCustomModel = async (model: string, provider: ModelProviderType) => {
    await post('custom-model/', {
      model,
      provider,
      user_email: getUserName(),
    })
  }

  return { addCustomModel }
}
