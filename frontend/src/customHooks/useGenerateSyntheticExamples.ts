import { type } from 'os'

import { useCallback, useState } from 'react'

import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'
import {
  Criteria,
  CriteriaWithOptions,
  DirectInstance,
  DomainEnum,
  EvaluationType,
  GenerationLengthEnum,
  Instance,
  ModelProviderType,
  PairwiseInstance,
  PersonaEnum,
  TaskEnum,
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
  selectedGenerationLength: GenerationLengthEnum | null
  selectedTask: TaskEnum | null
  selectedDomain: DomainEnum | null
  selectedPersona: PersonaEnum | null
  quantityPerCriteriaOption: { [k: string]: number }
}

export const useGenerateSyntheticExamples = (props: Props) => {
  const [loadingSyntheticExamples, setLoadingSyntheticExamples] = useState(false)
  const { post } = useFetchUtils()
  const { addToast, removeToast } = useToastContext()

  const fetchSyntheticExamples = useCallback(
    async ({
      credentials,
      evaluatorName,
      provider,
    }: {
      credentials: { [key: string]: string }
      evaluatorName: string
      provider: ModelProviderType
    }) => {
      setLoadingSyntheticExamples(true)

      const body = {
        provider: provider,
        llm_provider_credentials: credentials,
        evaluator_name: evaluatorName,
        type: props.evaluatorType,
        criteria: props.criteria,
        response_variable_name: props.responseVariableName,
        context_variables_names: props.contextVariableNames,
        generation_length: props.selectedGenerationLength,
        task: props.selectedTask,
        domain: props.selectedDomain,
        persona: props.selectedPersona,
        per_criteria_option_count: props.quantityPerCriteriaOption,
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
      props.quantityPerCriteriaOption,
      props.responseVariableName,
      props.selectedDomain,
      props.selectedGenerationLength,
      props.selectedPersona,
      props.selectedTask,
    ],
  )

  const generateTestData = useCallback(
    async ({
      credentials,
      evaluatorName,
      provider,
    }: {
      credentials: { [key: string]: string }
      evaluatorName: string
      provider: ModelProviderType
    }) => {
      const generationInProgressToastId = addToast({
        kind: 'info',
        title: 'Generating synthetic examples...',
      })
      const result = await fetchSyntheticExamples({ credentials, evaluatorName, provider })
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
      const syntheticExample = result.syntheticExamples[0]
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
      props.setInstances([...props.instances, syntheticInstance])
      addToast({
        kind: 'success',
        title: 'Synthetic examples generated succesfully',
        caption: `${result.syntheticExamples.length} example${result.syntheticExamples.length > 1 ? 's' : ''} ${
          result.syntheticExamples.length > 1 ? 'were' : 'was'
        } generated and added to the test data`,
        timeout: 5000,
      })
    },
    [addToast, fetchSyntheticExamples, props, removeToast],
  )

  return { fetchSystheticExamples: fetchSyntheticExamples, loadingSyntheticExamples, generateTestData }
}
