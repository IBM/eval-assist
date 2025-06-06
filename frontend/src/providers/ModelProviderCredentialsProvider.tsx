import { useLocalStorage } from 'usehooks-ts'

import { Dispatch, ReactNode, SetStateAction, createContext, useCallback, useContext, useEffect, useState } from 'react'

import { Loading } from '@carbon/react'

import { useFetchUtils } from '@customHooks/useFetchUtils'
import { ModelProviderCredentials, ModelProviderType, PartialModelProviderCredentials } from '@types'

const defaultWatsonxURL = 'https://us-south.ml.cloud.ibm.com'
const defaultOllamaURL = 'http://localhost:11434/'

const defaultCredentialStorage = {
  [ModelProviderType.WATSONX]: { api_key: '', project_id: '', api_base: '' },
  [ModelProviderType.OPENAI]: { api_key: '' },
  [ModelProviderType.OPENAI_LIKE]: { api_key: '', api_base: '' },
  [ModelProviderType.RITS]: { api_key: '' },
  [ModelProviderType.AZURE]: { api_key: '', api_base: '' },
  [ModelProviderType.LOCAL_HF]: {},
  [ModelProviderType.TOGETHER_AI]: { api_key: '' },
  [ModelProviderType.AWS]: { api_key: '' },
  [ModelProviderType.VERTEX_AI]: { api_key: '' },
  [ModelProviderType.REPLICATE]: { api_key: '' },
  [ModelProviderType.OLLAMA]: { api_base: '' },
}

const defaultCrendentials = {
  [ModelProviderType.WATSONX]: { api_key: '', project_id: '', api_base: defaultWatsonxURL },
  [ModelProviderType.OPENAI]: { api_key: '' },
  [ModelProviderType.OPENAI_LIKE]: { api_key: '', api_base: '' },
  [ModelProviderType.RITS]: { api_key: '' },
  [ModelProviderType.AZURE]: { api_key: '', api_base: '' },
  [ModelProviderType.LOCAL_HF]: {},
  [ModelProviderType.TOGETHER_AI]: { api_key: '' },
  [ModelProviderType.AWS]: { api_key: '' },
  [ModelProviderType.VERTEX_AI]: { api_key: '' },
  [ModelProviderType.REPLICATE]: { api_key: '' },
  [ModelProviderType.OLLAMA]: { api_base: '' },
}
interface ModelProviderCredentialsContextValue {
  modelProviderCredentials: ModelProviderCredentials
  defaultCrendentials: ModelProviderCredentials
  setModelProviderCredentials: Dispatch<SetStateAction<ModelProviderCredentials>>
  getCredentialKeysFromProvider: (provider: ModelProviderType) => string[]
  getAreRelevantCredentialsProvided: (provider: ModelProviderType) => boolean
  getProviderCredentials: (provider: ModelProviderType) => Record<string, string>
  getProviderCredentialsWithDefaults: (provider: ModelProviderType) => Record<string, string>
}

const ModelProviderCredentialsContext = createContext<ModelProviderCredentialsContextValue>({
  modelProviderCredentials: defaultCredentialStorage,
  defaultCrendentials,
  setModelProviderCredentials: () => {},
  getCredentialKeysFromProvider: () => [],
  getAreRelevantCredentialsProvided: () => false,
  getProviderCredentials: () => ({}),
  getProviderCredentialsWithDefaults: () => ({}),
})

export const useModelProviderCredentials = () => {
  return useContext(ModelProviderCredentialsContext)
}

export const ModelProviderCredentialsProvider = ({ children }: { children: ReactNode }) => {
  const [modelProviderCredentials, setModelProviderCredentials, removeModelProviderCredentials] =
    useLocalStorage<ModelProviderCredentials>('modelProviderCrentials', defaultCredentialStorage)
  const { get } = useFetchUtils()

  const [loadedDefaultCredentials, setLoadedDefaultCredentials] = useState(false)
  const [initializedModelProviderCredentials, setInitializedModelProviderCredentials] = useState(false)

  // Set default values for new model providers
  useEffect(() => {
    setModelProviderCredentials((prev) => {
      const parsedCredentials = { ...prev }
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
        parsedCredentials['azure'] = { api_key: '', api_base: '' }
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
        parsedCredentials['watsonx']['api_base'] = defaultWatsonxURL
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
      return parsedCredentials
    })
    setInitializedModelProviderCredentials(true)
  }, [setModelProviderCredentials])

  useEffect(() => {
    const getDefaultCredentials = async () => {
      const defaultCredentials = (await (await get('default-credentials/')).json()) as PartialModelProviderCredentials
      setLoadedDefaultCredentials(true)
      // only use default values for provider credentials that are empty
      setModelProviderCredentials((prev) => {
        const updatedCredentials = { ...prev }
        Object.keys(defaultCredentials).forEach((providerId) => {
          // @ts-ignore
          Object.keys(defaultCredentials[providerId]).forEach((credentialName) => {
            // @ts-ignore
            if (updatedCredentials[providerId][credentialName] === '')
              // @ts-ignore
              updatedCredentials[providerId][credentialName] = defaultCredentials[providerId][credentialName]
          })
        })
        return updatedCredentials
      })
    }
    if (initializedModelProviderCredentials) {
      getDefaultCredentials()
    }
  }, [get, initializedModelProviderCredentials, setModelProviderCredentials])

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
      Object.keys(getProviderCredentials(provider)).every((key) => {
        const credential = defaultCrendentials[provider]
        // @ts-ignore
        return getProviderCredentials(provider)[key] !== '' || defaultCrendentials[provider][key] !== ''
      }),
    [getProviderCredentials],
  )

  const getProviderCredentialsWithDefaults = useCallback(
    (provider: ModelProviderType): Record<string, string> => {
      return Object.fromEntries(
        Object.keys(getProviderCredentials(provider)).map((key) => [
          key,
          // @ts-ignore
          getProviderCredentials(provider)[key] || defaultCrendentials[provider][key],
        ]),
      )
    },
    [getProviderCredentials],
  )

  if (!initializedModelProviderCredentials || !loadedDefaultCredentials) return <Loading withOverlay />

  return (
    <ModelProviderCredentialsContext.Provider
      value={{
        modelProviderCredentials,
        defaultCrendentials,
        setModelProviderCredentials,
        getCredentialKeysFromProvider,
        getAreRelevantCredentialsProvided,
        getProviderCredentials,
        getProviderCredentialsWithDefaults,
      }}
    >
      {children}
    </ModelProviderCredentialsContext.Provider>
  )
}
