import { useCallback, useState } from 'react'

import { useModelProviderCredentials } from '@providers/ModelProviderCredentialsProvider'
import { Evaluator, ModelProviderType } from '@types'

import { useFetchUtils } from './useFetchUtils'

interface Props {
  model: Evaluator
}

export const useTestModelConnection = ({ model }: Props) => {
  const { post } = useFetchUtils()
  const { getProviderCredentialsWithDefaults } = useModelProviderCredentials()
  const [testingModelConnection, setTestingModelConnection] = useState(false)
  const [modelConnectionStatus, setModelConnectionStatus] = useState<'success' | 'failure' | null>(null)
  const [showingTestingModelConnectionSuccess, setShowingTestingModelConnectionSuccess] = useState(false)
  const testModelConnection = useCallback(async () => {
    setTestingModelConnection(true)
    const response = await post('test-model/', {
      provider: model.provider,
      llm_provider_credentials: getProviderCredentialsWithDefaults(model.provider),
      evaluator_name: model.name,
    })
    if (response.ok) {
      setModelConnectionStatus('success')
    } else {
      setModelConnectionStatus('failure')
    }
    setTestingModelConnection(false)
    setShowingTestingModelConnectionSuccess(true)
    setTimeout(() => {
      setShowingTestingModelConnectionSuccess(false)
      setModelConnectionStatus(null)
    }, 5000)
  }, [getProviderCredentialsWithDefaults, model.name, model.provider, post])

  return { testModelConnection, testingModelConnection, modelConnectionStatus, showingTestingModelConnectionSuccess }
}
