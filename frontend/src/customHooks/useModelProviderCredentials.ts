import { getJSONStringWithSortedKeys } from 'src/utils'
import { useLocalStorage } from 'usehooks-ts'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { ModelProviderCredentials, ModelProviderType } from '../types'

const watsonx_url = 'https://us-south.ml.cloud.ibm.com'

export const useModelProviderCredentials = () => {
  const defaultCredentialStorage = useMemo(
    () => ({
      [ModelProviderType.WATSONX]: { api_key: '', project_id: '', api_base: watsonx_url },
      [ModelProviderType.OPENAI]: { api_key: '' },
      [ModelProviderType.RITS]: { api_key: '' },
      [ModelProviderType.AZURE_OPENAI]: { api_key: '' },
    }),
    [],
  )
  const [modelProviderCredentials, setModelProviderCredentials, removeModelProviderCredentials] =
    useLocalStorage<ModelProviderCredentials>('modelProviderCrentials', defaultCredentialStorage)
  const [initializedModelProviderCredentials, setInitializedModelProviderCredentials] = useState(false)

  // Set default values for new model providers
  useEffect(() => {
    const parsedCredentials = { ...modelProviderCredentials }
    Object.keys(defaultCredentialStorage).forEach((key) => {
      if (!(key in parsedCredentials)) {
        // @ts-ignore
        parsedCredentials[key] = defaultCredentialStorage[key]
      }
    })

    if ('bam' in parsedCredentials) {
      // @ts-ignore
      delete parsedCredentials['bam']
    }

    if (!parsedCredentials.azure_openai) {
      parsedCredentials['azure_openai'] = { api_key: '' }
    }

    // watsonx key was apikey before, so we adapt it to api_key
    if (!('api_key' in parsedCredentials.watsonx)) {
      parsedCredentials['watsonx'] = {
        // @ts-ignore
        ...parsedCredentials.watsonx,
        api_key: parsedCredentials.watsonx['apikey'] || '',
      }
    }

    // @ts-ignore
    if ('apikey' in parsedCredentials.watsonx) {
      const aux = { ...parsedCredentials.watsonx }
      // @ts-ignore
      delete aux['apikey']
      parsedCredentials['watsonx'] = aux
    }

    if (!('api_base' in parsedCredentials.watsonx) || parsedCredentials.watsonx.api_base === '') {
      parsedCredentials['watsonx']['api_base'] = watsonx_url
    }

    // @ts-ignore
    if ('url' in parsedCredentials.watsonx) {
      const aux = { ...parsedCredentials.watsonx }
      // @ts-ignore
      delete aux['url']
      parsedCredentials['watsonx'] = aux
    }
    if (getJSONStringWithSortedKeys(modelProviderCredentials) !== getJSONStringWithSortedKeys(parsedCredentials)) {
      setModelProviderCredentials(parsedCredentials)
    }
    setInitializedModelProviderCredentials(true)
  }, [defaultCredentialStorage, modelProviderCredentials, setModelProviderCredentials])

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
    initializedModelProviderCredentials,
  }
}
