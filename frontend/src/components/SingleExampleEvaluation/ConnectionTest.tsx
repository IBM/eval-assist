import { useCallback, useState } from 'react'

import { Link } from '@carbon/react'
import { Checkmark, ConnectionSignal, MisuseOutline } from '@carbon/react/icons'

import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useModelProviderCredentials } from '@providers/ModelProviderCredentialsProvider'
import { Evaluator } from '@types'

import classes from './ConnectionTest.module.scss'

interface Props {
  model: Evaluator | null
}

export const ConnectionTest = ({ model }: Props) => {
  const [testingModelConnection, setTestingModelConnection] = useState(false)
  const [modelConnectionStatus, setModelConnectionStatus] = useState<'success' | 'failure' | null>(null)
  const [showingTestingModelConnectionSuccess, setShowingTestingModelConnectionSuccess] = useState(false)
  const { getProviderCredentialsWithDefaults } = useModelProviderCredentials()
  const { post } = useFetchUtils()

  const testModelConnection = useCallback(async () => {
    if (!model) return
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
  }, [model, getProviderCredentialsWithDefaults, post])

  return !testingModelConnection && !showingTestingModelConnectionSuccess ? (
    <Link disabled={!model} style={{ cursor: 'pointer' }} renderIcon={ConnectionSignal} onClick={testModelConnection}>
      {'Test connection'}
    </Link>
  ) : testingModelConnection ? (
    <p className={classes.connectionTestingFont}>{'Testing model connection...'}</p>
  ) : showingTestingModelConnectionSuccess ? (
    <div className={classes.successConnectionContainer}>
      {modelConnectionStatus == 'success' ? (
        <>
          <p className={classes.connectionTestingFont}>Model connection test succeeded</p>
          <Checkmark className={classes.successLogo} />
        </>
      ) : (
        <>
          <p className={classes.connectionTestingFont}>Model connection test failed</p>
          <MisuseOutline className={classes.failureLogo} />
        </>
      )}
    </div>
  ) : null
}
