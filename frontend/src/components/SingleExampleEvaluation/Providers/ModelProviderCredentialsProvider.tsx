import { getJSONStringWithSortedKeys } from 'src/utils'
import { useLocalStorage } from 'usehooks-ts'

import { Dispatch, ReactNode, SetStateAction, createContext, useCallback, useContext, useEffect, useState } from 'react'

import { ModelProviderCredentials, ModelProviderType } from '@types'

const watsonx_url = 'https://us-south.ml.cloud.ibm.com'

const defaultCredentialStorage = {
  [ModelProviderType.WATSONX]: { api_key: '', project_id: '', api_base: watsonx_url },
  [ModelProviderType.OPENAI]: { api_key: '' },
  [ModelProviderType.RITS]: { api_key: '' },
  [ModelProviderType.AZURE_OPENAI]: { api_key: '' },
  [ModelProviderType.LOCAL_HF]: {},
}

interface ModelProviderCredentialsContextValue {
  modelProviderCredentials: ModelProviderCredentials
  setModelProviderCredentials: Dispatch<SetStateAction<ModelProviderCredentials>>
  initializedModelProviderCredentials: boolean
  getCredentialKeysFromProvider: (provider: ModelProviderType) => string[]
  getAreRelevantCredentialsProvided: (provider: ModelProviderType) => boolean
  getProviderCredentials: (provider: ModelProviderType) => Record<string, string>
}

const ModelProviderCredentialsContext = createContext<ModelProviderCredentialsContextValue>({
  modelProviderCredentials: defaultCredentialStorage,
  setModelProviderCredentials: () => {},
  initializedModelProviderCredentials: false,
  getCredentialKeysFromProvider: () => [],
  getAreRelevantCredentialsProvided: () => false,
  getProviderCredentials: () => ({}),
})

export const useModelProviderCredentials = () => {
  return useContext(ModelProviderCredentialsContext)
}

export const ModelProviderCredentialsProvider = ({ children }: { children: ReactNode }) => {
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

    // add azure key if the storage was already initialized
    if (!parsedCredentials.azure) {
      parsedCredentials['azure'] = { api_key: '' }
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

    // openai was renamed to open-ai
    if (!!!parsedCredentials['open-ai']) {
      // @ts-ignore
      if (parsedCredentials['openai']) {
        // @ts-ignore
        parsedCredentials['open-ai'] = { ...parsedCredentials['openai'] }
        // @ts-ignore
        delete parsedCredentials['openai']
      }
    }

    if (getJSONStringWithSortedKeys(modelProviderCredentials) !== getJSONStringWithSortedKeys(parsedCredentials)) {
      setModelProviderCredentials(parsedCredentials)
    }
    setInitializedModelProviderCredentials(true)
  }, [modelProviderCredentials, setModelProviderCredentials])

  const getCredentialKeysFromProvider = useCallback(
    (provider: ModelProviderType) => {
      return Object.keys(modelProviderCredentials[provider])
    },
    [modelProviderCredentials],
  )

  const getProviderCredentials = useCallback(
    (provider: ModelProviderType): Record<string, string> =>
      modelProviderCredentials[provider] ? modelProviderCredentials[provider] : {},
    [modelProviderCredentials],
  )

  const getAreRelevantCredentialsProvided = useCallback(
    (provider: ModelProviderType): boolean =>
      modelProviderCredentials[provider] &&
      Object.values(modelProviderCredentials[provider]).every((key) => key !== ''),
    [modelProviderCredentials],
  )

  return (
    <ModelProviderCredentialsContext.Provider
      value={{
        modelProviderCredentials,
        setModelProviderCredentials,
        initializedModelProviderCredentials,
        getCredentialKeysFromProvider,
        getAreRelevantCredentialsProvided,
        getProviderCredentials,
      }}
    >
      {children}
    </ModelProviderCredentialsContext.Provider>
  )
}
