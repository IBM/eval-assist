import { useLocalStorage } from 'usehooks-ts'

import { useCallback, useEffect } from 'react'

import { ModelProviderCredentials, ModelProviderType } from '../types'

export const useModelProviderCredentials = () => {
  const [modelProviderCredentials, setModelProviderCredentials, removeModelProviderCredentials] =
    useLocalStorage<ModelProviderCredentials>('modelProviderCrentials', {
      [ModelProviderType.WATSONX]: { api_key: '', project_id: '', url: 'https://us-south.ml.cloud.ibm.com' },
      [ModelProviderType.OPENAI]: { api_key: '' },
      [ModelProviderType.RITS]: { api_key: '' },
      [ModelProviderType.AZURE_OPENAI]: { api_key: '' },
    })

  // Set default values for new model providers
  useEffect(() => {
    if (!modelProviderCredentials.azure_openai) {
      setModelProviderCredentials({
        ...modelProviderCredentials,
        azure_openai: { api_key: '' },
      })
    }

    // watsonx key was apikey before, so we adapt it to api_key
    if (!modelProviderCredentials.watsonx.api_key) {
      setModelProviderCredentials({
        ...modelProviderCredentials,
        watsonx: {
          ...modelProviderCredentials.watsonx,
          // @ts-ignore
          api_key: modelProviderCredentials.watsonx['apikey'] || '',
        },
      })
    }

    // @ts-ignore
    if (modelProviderCredentials.watsonx['apikey']) {
      const aux = { ...modelProviderCredentials.watsonx }
      // @ts-ignore
      delete aux['apikey']
      setModelProviderCredentials({
        ...modelProviderCredentials,
        watsonx: aux,
      })
    }
  }, [modelProviderCredentials, setModelProviderCredentials])

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
