import { useLocalStorage } from 'usehooks-ts'

import { useCallback, useMemo } from 'react'

import { ModelProviderCredentials, ModelProviderType } from '../types'

export const useModelProviderCredentials = () => {
  const [modelProviderCredentials, setModelProviderCredentials, removeModelProviderCredentials] =
    useLocalStorage<ModelProviderCredentials>('modelProviderCrentials', {
      [ModelProviderType.WATSONX]: { apikey: '', project_id: '', url: 'https://us-south.ml.cloud.ibm.com' },
      [ModelProviderType.OPENAI]: { api_key: '' },
      [ModelProviderType.RITS]: { api_key: '' },
    })

  const getAreRelevantCredentialsProvided = useCallback(
    (provider: ModelProviderType): boolean => {
      return Object.values(modelProviderCredentials[provider]).every((key) => key !== '')
    },
    [modelProviderCredentials],
  )

  return {
    modelProviderCredentials,
    setModelProviderCredentials,
    getAreRelevantCredentialsProvided,
  }
}
