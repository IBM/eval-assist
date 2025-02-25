import { useState } from 'react'

import { Criteria, CriteriaWithOptions, EvaluationType, ModelProviderCredentials, ModelProviderType } from '@types'

import { useFetchUtils } from './useFetchUtils'

interface Props {
  provider?: ModelProviderType
  credentials?: { [key: string]: string }
  evaluatorName?: string
  evaluatorType?: EvaluationType
  criteria?: CriteriaWithOptions | Criteria
  responseVariableName?: string
  contextVariableNames: string[]
}

export const useGenerateSystheticExamples = (props: Props) => {
  const [loadingSyntheticExamples, setLoadingSyntheticExamples] = useState(false)
  const { post } = useFetchUtils()

  const fetchSystheticExamples = async () => {
    setLoadingSyntheticExamples(true)

    const body = {
      provider: props.provider,
      llm_provider_credentials: props.credentials,
      evaluator_name: props.evaluatorName,
      type: props.evaluatorType,
      criteria: props.criteria,
      response_variable_name: props.responseVariableName,
      context_variables_names: props.contextVariableNames,
    }

    const response = await post('synthetic-examples/', body)

    if (!response.ok) {
      const error = (await response.json()) as {
        detail: string
      }

      const errorMessage =
        typeof error.detail === 'string'
          ? error.detail
          : `Something went wrong with the evaluation (${(error.detail as { type: string; msg: string }[])[0].type}: ${
              (error.detail as { type: string; msg: string }[])[0].msg
            })`

      setLoadingSyntheticExamples(false)
      return {
        syntheticExamples: [],
        failed: true,
        errorMessage,
      }
    }

    const syntheticExamples = await response.json()

    setLoadingSyntheticExamples(false)

    return { syntheticExamples, failed: false, errorMessage: '' }
  }

  return { fetchSystheticExamples, loadingSyntheticExamples }
}
