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
          syntheticExamples: [],
          failed: true,
          errorMessage,
        }
      }

      const syntheticExamples = await response.json()

      setLoadingSyntheticExamples(false)

      return { syntheticExamples, failed: false, errorMessage: '' }
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
      const syntheticExamples = result.syntheticExamples.map((syntheticExample: Record<string, string>) => {
        let syntheticInstance: Instance = {
          contextVariables: props.contextVariableNames.map((contextVariableName) => ({
            name: contextVariableName,
            value: syntheticExample[contextVariableName],
          })),
          expectedResult: '',
          result: null,
        }

        if (props.type === EvaluationType.DIRECT) {
          ;(syntheticInstance as DirectInstance) = {
            ...syntheticInstance,
            response: syntheticExample[props.responseVariableName!],
          }
        } else {
          ;(syntheticInstance as PairwiseInstance) = {
            ...syntheticInstance,
            responses: (props.instances[0] as PairwiseInstance).responses.map((_) => ''),
          }
        }
        return syntheticInstance
      })

      props.setInstances([...props.instances, ...syntheticExamples])
      addToast({
        kind: 'success',
        title: 'Synthetic examples generated succesfully',
        caption: `${result.syntheticExamples.length} example${result.syntheticExamples.length > 1 ? 's' : ''} ${
          result.syntheticExamples.length > 1 ? 'were' : 'was'
        } generated and added to the test data (took ${totalEvaluationTime} seconds)`,
        timeout: 5000,
      })
    },
    [addToast, fetchSyntheticExamples, props, removeToast],
  )

  return { fetchSystheticExamples: fetchSyntheticExamples, loadingSyntheticExamples, generateTestData }
}
