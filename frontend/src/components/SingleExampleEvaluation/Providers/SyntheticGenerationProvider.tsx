import { useLocalStorage } from 'usehooks-ts'

import {
  Dispatch,
  ReactNode,
  SetStateAction,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useCurrentTestCase } from '@components/SingleExampleEvaluation/Providers/CurrentTestCaseProvider'
import { useToastContext } from '@components/SingleExampleEvaluation/Providers/ToastProvider'
import { DirectActionTypeEnum, DomainEnum, GenerationLengthEnum, PersonaEnum, TaskEnum } from '@constants'
import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'
import { CriteriaWithOptions, DirectInstance } from '@types'
import { returnByPipelineType } from '@utils'

import { useUserUseCasesContext } from './UserUseCasesProvider'

interface SyntheticGenerationContextValue {
  loadingSyntheticExamples: boolean
  generateTestData: () => Promise<void>
  tasksOptions: TaskEnum[]
  domainsOptions: DomainEnum[]
  personasOptions: PersonaEnum[]
  generationLengthOptions: GenerationLengthEnum[]
  loadingDomainPersonaMapping: boolean
  loadDomainPersonaMapping: () => Promise<void>
  performDirectAIAction: ({}: {
    text: string
    selection: string
    action: DirectActionTypeEnum
    prompt?: string
    instanceId: string
    fieldName: string
  }) => Promise<string>
  loadingDirectAIAction: boolean
  hasGeneratedSyntheticMap: Record<string, boolean>
  setHasGeneratedSyntheticMap: Dispatch<SetStateAction<Record<string, boolean>>>
}

const SyntheticGenerationContext = createContext<SyntheticGenerationContextValue>({
  loadingSyntheticExamples: false,
  generateTestData: () => Promise.resolve(),
  tasksOptions: [],
  domainsOptions: [],
  personasOptions: [],
  generationLengthOptions: [],
  loadDomainPersonaMapping: () => Promise.resolve(),
  loadingDomainPersonaMapping: false,
  performDirectAIAction: () => Promise.resolve(''),
  loadingDirectAIAction: false,
  hasGeneratedSyntheticMap: {},
  setHasGeneratedSyntheticMap: () => {},
})

export const useSyntheticGeneration = () => useContext(SyntheticGenerationContext)

export const SyntheticGenerationProvider = ({ children }: { children: ReactNode }) => {
  const [domainPersonaMap, setDomainPersonaMap] = useState<{ [key in DomainEnum]: PersonaEnum[] } | null>(null)

  const [loadingSyntheticExamples, setLoadingSyntheticExamples] = useState(false)
  const [loadingDirectAIAction, setLoadingDirectAIAction] = useState(false)
  const { currentTestCase, setCurrentTestCase, currentGenerationProviderCredentials } = useCurrentTestCase()
  const [loadingDomainPersonaMapping, setLoadingDomainPersonaMapping] = useState(false)
  const { post, get } = useFetchUtils()
  const { addToast, removeToast } = useToastContext()

  const domains = useMemo(
    () => (domainPersonaMap ? (Object.keys(domainPersonaMap) as DomainEnum[]) : []),
    [domainPersonaMap],
  )

  const personas = useMemo(
    () =>
      domainPersonaMap && currentTestCase.syntheticGenerationConfig && currentTestCase.syntheticGenerationConfig.domain
        ? domainPersonaMap[currentTestCase.syntheticGenerationConfig.domain] || []
        : [],
    [domainPersonaMap, currentTestCase.syntheticGenerationConfig],
  )

  const tasksOptions = useMemo(() => Object.values(TaskEnum), [])

  const domainsOptions = useMemo(() => domains, [domains])

  const personasOptions = useMemo(() => personas, [personas])

  const generationLengthOptions = useMemo(() => Object.values(GenerationLengthEnum), [])

  const loadDomainPersonaMapping = useCallback(async () => {
    setLoadingDomainPersonaMapping(true)
    const response = await (await get('domains-and-personas/')).json()
    setDomainPersonaMap(response)
    setLoadingDomainPersonaMapping(false)
  }, [get])

  const fetchDirectAIAction = useCallback(
    async ({
      text,
      selection,
      action,
      prompt,
      instanceId,
      fieldName,
    }: {
      text: string
      selection: string
      action: DirectActionTypeEnum
      prompt?: string
      instanceId: string
      fieldName: string
    }) => {
      setLoadingDirectAIAction(true)

      const body = {
        provider: currentTestCase.syntheticGenerationConfig.evaluator?.provider,
        llm_provider_credentials: currentGenerationProviderCredentials,
        evaluator_name: currentTestCase.syntheticGenerationConfig.evaluator?.name,
        type: currentTestCase.type,
        text,
        selection,
        action,
        prompt,
        instanceId,
        fieldName,
      }

      const response = await post('direct-ai-action/', body)
      setLoadingDirectAIAction(false)

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

        return {
          result: '',
          failed: true,
          errorMessage,
        }
      }

      const { result } = await response.json()

      return { result, failed: false, errorMessage: '' }
    },
    [
      currentGenerationProviderCredentials,
      currentTestCase.syntheticGenerationConfig.evaluator?.name,
      currentTestCase.syntheticGenerationConfig.evaluator?.provider,
      currentTestCase.type,
      post,
    ],
  )

  const performDirectAIAction = useCallback(
    async ({
      text,
      selection,
      action,
      prompt,
      instanceId,
      fieldName,
    }: {
      text: string
      selection: string
      action: DirectActionTypeEnum
      prompt?: string
      instanceId: string
      fieldName: string
    }) => {
      const generationInProgressToastId = addToast({
        kind: 'info',
        title: 'Generating direct action...',
      })
      const startEvaluationTime = new Date().getTime() / 1000
      const result = await fetchDirectAIAction({ text, selection, action, prompt, instanceId, fieldName })
      const endEvaluationTime = new Date().getTime() / 1000
      const totalEvaluationTime = Math.round(endEvaluationTime - startEvaluationTime)

      removeToast(generationInProgressToastId)

      if (result.failed) {
        addToast({
          kind: 'error',
          title: 'Generation failed',
          subtitle: result.errorMessage,
          timeout: 5000,
        })
        return
      }
      return result.result
    },
    [addToast, fetchDirectAIAction, removeToast],
  )

  const criteriaOptionNames = useMemo(
    () =>
      currentTestCase.criteria && currentTestCase.type
        ? returnByPipelineType(
            currentTestCase.type,
            () => (currentTestCase.criteria as CriteriaWithOptions).options.map((option) => option.name),
            [],
          )
        : [],
    [currentTestCase.criteria, currentTestCase.type],
  )

  useEffect(() => {
    setCurrentTestCase((prevCurrentTestCase) => {
      const updatedTestCase = { ...prevCurrentTestCase }

      if (prevCurrentTestCase.syntheticGenerationConfig.perCriteriaOptionCount !== null) {
        if (
          !criteriaOptionNames.every(
            (criteriaOptionName) =>
              criteriaOptionName in prevCurrentTestCase.syntheticGenerationConfig.perCriteriaOptionCount!,
          )
        ) {
          const newSyntheticGenerationConfig = { ...prevCurrentTestCase.syntheticGenerationConfig }
          const result: Record<string, number> = {}
          // add new
          criteriaOptionNames.forEach((k) => {
            if (!Object.keys(newSyntheticGenerationConfig).includes(k)) {
              result[k] = 1
            } else {
              result[k] = newSyntheticGenerationConfig.perCriteriaOptionCount![k]
            }
          })
          newSyntheticGenerationConfig.perCriteriaOptionCount = result
          updatedTestCase.syntheticGenerationConfig = newSyntheticGenerationConfig
        }
      }
      return updatedTestCase
    })
  }, [criteriaOptionNames, setCurrentTestCase])

  const fetchSyntheticExamples = useCallback(async () => {
    setLoadingSyntheticExamples(true)

    const body = {
      provider: currentTestCase.syntheticGenerationConfig.evaluator?.provider,
      llm_provider_credentials: currentGenerationProviderCredentials,
      evaluator_name: currentTestCase.syntheticGenerationConfig.evaluator?.name,
      type: currentTestCase.type,
      criteria: currentTestCase.criteria,
      response_variable_name: currentTestCase.responseVariableName,
      context_variables_names: currentTestCase.contextVariableNames,
      generation_length: currentTestCase.syntheticGenerationConfig.generationLength,
      task: currentTestCase.syntheticGenerationConfig.task,
      domain: currentTestCase.syntheticGenerationConfig.domain,
      persona: currentTestCase.syntheticGenerationConfig.persona,
      per_criteria_option_count: currentTestCase.syntheticGenerationConfig.perCriteriaOptionCount,
      borderline_count: currentTestCase.syntheticGenerationConfig.borderlineCount,
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
      id: unparsedGeneratedInstance.id,
    }))
    setLoadingSyntheticExamples(false)

    return { generatedInstances, failed: false, errorMessage: '' }
  }, [currentGenerationProviderCredentials, currentTestCase, post])

  const generateTestData = useCallback(async () => {
    const generationInProgressToastId = addToast({
      kind: 'info',
      title: 'Generating synthetic examples...',
    })
    const startEvaluationTime = new Date().getTime() / 1000
    const result = await fetchSyntheticExamples()
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
    setCurrentTestCase({
      ...currentTestCase,
      instances: [...currentTestCase.instances, ...result.generatedInstances],
    })
    addToast({
      kind: 'success',
      title: 'Synthetic examples generated succesfully',
      caption: `${result.generatedInstances.length} example${result.generatedInstances.length > 1 ? 's' : ''} ${
        result.generatedInstances.length > 1 ? 'were' : 'was'
      } generated and added to the test data (took ${totalEvaluationTime} seconds)`,
      timeout: 5000,
    })
  }, [addToast, currentTestCase, fetchSyntheticExamples, removeToast, setCurrentTestCase])

  const { userUseCases } = useUserUseCasesContext()
  const { allLibraryUseCases } = useTestCaseLibrary()
  const [hasGeneratedSyntheticMap, setHasGeneratedSyntheticMap, removeHasGeneratedSyntheticMap] = useLocalStorage<
    Record<string, boolean>
  >(
    'hasGeneratedSyntheticMap',
    Object.fromEntries([...userUseCases, ...allLibraryUseCases].map((u) => [u.name, false])),
  )

  useEffect(() => {
    setHasGeneratedSyntheticMap((prev) => ({
      ...Object.fromEntries(Object.keys(prev).map((k) => [k, prev[k]])),
      ...Object.fromEntries(userUseCases.map((u) => [u.name, false])),
    }))
  }, [setHasGeneratedSyntheticMap, userUseCases])

  return (
    <SyntheticGenerationContext.Provider
      value={{
        loadingSyntheticExamples,
        generateTestData,
        tasksOptions,
        domainsOptions,
        personasOptions,
        generationLengthOptions,
        loadingDomainPersonaMapping,
        loadingDirectAIAction,
        loadDomainPersonaMapping,
        performDirectAIAction,
        hasGeneratedSyntheticMap,
        setHasGeneratedSyntheticMap,
      }}
    >
      {children}
    </SyntheticGenerationContext.Provider>
  )
}
