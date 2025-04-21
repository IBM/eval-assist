import { useCallback, useState } from 'react'

import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'
import {
  Criteria,
  CriteriaWithOptions,
  DirectInstance,
  EvaluationType,
  Instance,
  ModelProviderType,
  PairwiseInstance,
  SyntheticGenerationConfig,
} from '@types'

import { useFetchUtils } from './useFetchUtils'

interface Props {
  evaluatorType?: EvaluationType
  criteria?: CriteriaWithOptions | Criteria
  responseVariableName?: string
  contextVariableNames: string[]
  instances: Instance[]
  setInstances: (instances: Instance[]) => void
  type: EvaluationType
  syntheticGenerationConfig: SyntheticGenerationConfig
}

export const useGenerateSyntheticExamples = (props: Props) => {
  const [loadingSyntheticExamples, setLoadingSyntheticExamples] = useState(false)
  const { post } = useFetchUtils()
  const { addToast, removeToast } = useToastContext()

  const fetchSyntheticExamples = useCallback(
    async ({ credentials }: { credentials: { [key: string]: string } }) => {
      setLoadingSyntheticExamples(true)

      const body = {
        provider: props.syntheticGenerationConfig.evaluator?.provider,
        llm_provider_credentials: credentials,
        evaluator_name: props.syntheticGenerationConfig.evaluator?.name,
        type: props.evaluatorType,
        criteria: props.criteria,
        response_variable_name: props.responseVariableName,
        context_variables_names: props.contextVariableNames,
        generation_length: props.syntheticGenerationConfig.generationLength,
        task: props.syntheticGenerationConfig.task,
        domain: props.syntheticGenerationConfig.domain,
        persona: props.syntheticGenerationConfig.persona,
        per_criteria_option_count: props.syntheticGenerationConfig.perCriteriaOptionCount,
        borderline_count: props.syntheticGenerationConfig.borderlineCount,
      }

      const response = await post('synthetic-examples/', body)

      if (!response.ok) {
        const error = (await response.json()) as {
          detail: string
        }

        const errorMessage =
          typeof error.detail === 'string'
            ? error.detail
            : `Something went wrong with the evaluation (${
                (error.detail as { type: string; msg: string }[])[0].type
              }: ${(error.detail as { type: string; msg: string }[])[0].msg})`

        setLoadingSyntheticExamples(false)
        return {
          generatedInstances: [],
          failed: true,
          errorMessage,
        }
      }

      const unparsedGeneratedInstances = await response.json()
      const generatedInstances: DirectInstance[] = unparsedGeneratedInstances.map((unparsedGeneratedInstance: any) => ({
        contextVariables: Object.entries(unparsedGeneratedInstance.context_variables).map(([name, value]) => ({
          name,
          value,
        })),
        expectedResult: '',
        result: null,
        metadata: unparsedGeneratedInstance.metadata,
        response: unparsedGeneratedInstance.response,
      }))
      setLoadingSyntheticExamples(false)

      return { generatedInstances, failed: false, errorMessage: '' }
    },
    [
      post,
      props.contextVariableNames,
      props.criteria,
      props.evaluatorType,
      props.responseVariableName,
      props.syntheticGenerationConfig,
    ],
  )

  const generateTestData = useCallback(
    async ({ credentials }: { credentials: { [key: string]: string } }) => {
      const generationInProgressToastId = addToast({
        kind: 'info',
        title: 'Generating synthetic examples...',
      })
      const startEvaluationTime = new Date().getTime() / 1000
      const result = await fetchSyntheticExamples({ credentials })
      const endEvaluationTime = new Date().getTime() / 1000
      const totalEvaluationTime = Math.round(endEvaluationTime - startEvaluationTime)

      removeToast(generationInProgressToastId)

      if (result.failed) {
        addToast({
          kind: 'error',
          title: 'Evaluation failed',
          subtitle: result.errorMessage,
          timeout: 5000,
        })
        return
      }
      props.setInstances([...props.instances, ...result.generatedInstances])
      addToast({
        kind: 'success',
        title: 'Synthetic examples generated succesfully',
        caption: `${result.generatedInstances.length} example${result.generatedInstances.length > 1 ? 's' : ''} ${
          result.generatedInstances.length > 1 ? 'were' : 'was'
        } generated and added to the test data (took ${totalEvaluationTime} seconds)`,
        timeout: 5000,
      })
    },
    [addToast, fetchSyntheticExamples, props, removeToast],
  )

  return { fetchSystheticExamples: fetchSyntheticExamples, loadingSyntheticExamples, generateTestData }
}
