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
}

export const useGenerateSystheticExamples = (props: Props) => {
  const [loadingSyntheticExamples, setLoadingSyntheticExamples] = useState(false)
  const { post } = useFetchUtils()

  const fetchSystheticExamples = async () => {
    const body = {
      provider: props.provider,
      llm_provider_credentials: props.credentials,
      evaluator_name: props.evaluatorName,
      type: props.evaluatorType,
      criteria: props.criteria,
      response_variable_name: props.responseVariableName,
    }
    const syntheticExamples = (await (await post('synthetic-examples/', body)).json())['systhetic_examples']
    return syntheticExamples
  }

  return { fetchSystheticExamples }
}
