import { useModelProviderCredentials } from '@providers/ModelProviderCredentialsProvider'
import { ModelProviderType } from '@types'

import { useFetchUtils } from './useFetchUtils'

export const useTestModelConnection = () => {
  const { post } = useFetchUtils()
  const { getProviderCredentialsWithDefaults } = useModelProviderCredentials()
  const testModelConnection = (provider: ModelProviderType, name: string) => {
    post('test-model-connection/', {
      provider: provider,
      llm_provider_credentials: getProviderCredentialsWithDefaults(provider),
      model_name: name,
    })
  }

  return { testModelConnection }
}
