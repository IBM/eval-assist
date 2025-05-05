import { getEmptyTestCase, getJSONStringWithSortedKeys, returnByPipelineType, toSnakeCase } from 'src/utils'

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

import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'

import {
  DirectInstance,
  EvaluationType,
  Evaluator,
  Instance,
  ModelProviderType,
  PairwiseInstance,
  TestCase,
} from '../../../types'
import { useCriteriasContext } from './CriteriasProvider'
import { useEvaluatorOptionsContext } from './EvaluatorOptionsProvider'
import { useModelProviderCredentials } from './ModelProviderCredentialsProvider'
import { useURLParamsContext } from './URLParamsProvider'
import { useUserUseCasesContext } from './UserUseCasesProvider'

interface CurrentTestCaseContextValue {
  currentTestCase: TestCase
  setCurrentTestCase: (value: SetStateAction<TestCase>) => void
  preloadedTestCase: TestCase | null
  showingTestCase: boolean
  responses: string[] | string[][]
  currentTestCaseString: string
  lastSavedUseCaseString: string
  setLastSavedTestCaseString: Dispatch<SetStateAction<string>>
  changesDetected: boolean
  isTestCaseSaved: boolean
  testCaseSelected: {
    useCase: TestCase
    subCatalogName: string | null
  } | null
  setTestCaseSelected: Dispatch<
    SetStateAction<{
      useCase: TestCase
      subCatalogName: string | null
    } | null>
  >
  areRelevantCredentialsProvided: boolean
  currentProviderCredentials: Record<string, string>
  currentGenerationProviderCredentials: Record<string, string>
  selectedInstance: Instance | null
  setSelectedInstance: Dispatch<SetStateAction<Instance | null>>
  getStringifiedInstanceContent: (instance: Instance) => string
  instancesLastEvaluatedContent: Record<string, string | null>
  setInstancesLastEvaluatedContent: Dispatch<SetStateAction<Record<string, string | null>>>
  outdatedResultInstanceIds: string[]
  isInstanceResultOutdated: Record<string, boolean>
}

const CurrentTestCaseContext = createContext<CurrentTestCaseContextValue>({
  getStringifiedInstanceContent: () => '',
  instancesLastEvaluatedContent: {},
  setInstancesLastEvaluatedContent: () => {},
  outdatedResultInstanceIds: [],
  isInstanceResultOutdated: {},
  currentTestCase: getEmptyTestCase(EvaluationType.DIRECT),
  setCurrentTestCase: () => null,
  preloadedTestCase: null,
  showingTestCase: false,
  responses: [],
  currentTestCaseString: '',
  lastSavedUseCaseString: '',
  setLastSavedTestCaseString: () => null,
  changesDetected: false,
  isTestCaseSaved: false,
  testCaseSelected: null,
  setTestCaseSelected: () => null,
  areRelevantCredentialsProvided: false,
  currentProviderCredentials: {},
  currentGenerationProviderCredentials: {},
  selectedInstance: null,
  setSelectedInstance: () => null,
})

export const useCurrentTestCase = () => {
  return useContext(CurrentTestCaseContext)
}

export const CurrentTestCaseProvider = ({ children }: { children: ReactNode }) => {
  const { isRisksAndHarms, useCaseType, useCaseId, subCatalogName, libraryTestCaseName, criteriaName } =
    useURLParamsContext()
  const { modelProviderCredentials, getAreRelevantCredentialsProvided, getProviderCredentials } =
    useModelProviderCredentials()
  const { getEmptyUseCaseWithCriteria } = useCriteriasContext()
  const { directEvaluators, pairwiseEvaluators } = useEvaluatorOptionsContext()
  const { userUseCases } = useUserUseCasesContext()
  const { allLibraryUseCases, harmsAndRisksLibraryTestCases } = useTestCaseLibrary()

  const getDefaultEvaluator = useCallback(
    (type: EvaluationType, onlyInstruct: boolean = false) => {
      if (directEvaluators === null || pairwiseEvaluators === null || type === null) {
        // won't happen!
        return null
      }
      if (isRisksAndHarms && !onlyInstruct) {
        return directEvaluators.find((p) => p.name.toLocaleLowerCase().includes('granite guardian')) as Evaluator
      } else {
        const ritsCredentialsExist = getAreRelevantCredentialsProvided(ModelProviderType.RITS)
        const watsonxCredentialsExist = getAreRelevantCredentialsProvided(ModelProviderType.WATSONX)
        const openaiCredentialsExist = getAreRelevantCredentialsProvided(ModelProviderType.OPENAI)
        const azureCredentialsExist = getAreRelevantCredentialsProvided(ModelProviderType.AZURE_OPENAI)
        const defaultProvider = watsonxCredentialsExist
          ? ModelProviderType.WATSONX
          : ritsCredentialsExist
          ? ModelProviderType.RITS
          : openaiCredentialsExist
          ? ModelProviderType.OPENAI
          : azureCredentialsExist
          ? ModelProviderType.AZURE_OPENAI
          : null

        if (defaultProvider === null) return null

        const defaultEvaluatorKeyword =
          watsonxCredentialsExist || ritsCredentialsExist || (!openaiCredentialsExist && !azureCredentialsExist)
            ? 'llama3.3'
            : 'gpt-4o'
        return returnByPipelineType(
          type,
          directEvaluators.find(
            (p) => p.name.toLowerCase().includes(defaultEvaluatorKeyword) && p.provider === defaultProvider,
          ) as Evaluator,
          pairwiseEvaluators.find(
            (p) => p.name.toLowerCase().includes(defaultEvaluatorKeyword) && p.provider === defaultProvider,
          ) as Evaluator,
        )
      }
    },
    // eslint-disable-next-line
    [
      // if uncomment the next line the current chosen selected model can automatically
      // change if the used sets adds credentials for a new provider
      // getAreRelevantCredentialsProvided,
      isRisksAndHarms,
      pairwiseEvaluators,
      directEvaluators,
      useCaseType,
    ],
  )

  const [testCaseSelected, setTestCaseSelected] = useState<{ useCase: TestCase; subCatalogName: string | null } | null>(
    null,
  )

  const preloadedTestCase = useMemo(() => {
    let pu: TestCase | null
    if (useCaseId !== null && userUseCases !== null) {
      pu = userUseCases.find((userUseCase) => userUseCase.id === useCaseId) || null
    } else if (libraryTestCaseName !== null && useCaseType !== null) {
      if (isRisksAndHarms && subCatalogName !== null) {
        pu =
          harmsAndRisksLibraryTestCases[subCatalogName].find(
            (libraryUseCase) => libraryUseCase.name === libraryTestCaseName,
          ) || null
      } else {
        pu =
          allLibraryUseCases.find(
            (libraryUseCase) => libraryUseCase.name === libraryTestCaseName && libraryUseCase.type === useCaseType,
          ) || null
      }
    } else if (useCaseType !== null && useCaseId === null && libraryTestCaseName === null) {
      if (criteriaName !== null) {
        pu = getEmptyUseCaseWithCriteria(criteriaName, useCaseType)
      } else {
        pu = getEmptyTestCase(useCaseType)
      }
    } else {
      pu = null
    }
    if (pu !== null) {
      if (!pu.evaluator) {
        pu = { ...pu, evaluator: getDefaultEvaluator(pu.type) }
      }
      if (!pu.syntheticGenerationConfig.evaluator) {
        pu = {
          ...pu,
          syntheticGenerationConfig: { ...pu.syntheticGenerationConfig, evaluator: getDefaultEvaluator(pu.type, true) },
        }
      }
    }

    return pu
  }, [
    useCaseId,
    userUseCases,
    libraryTestCaseName,
    useCaseType,
    isRisksAndHarms,
    subCatalogName,
    harmsAndRisksLibraryTestCases,
    allLibraryUseCases,
    criteriaName,
    getEmptyUseCaseWithCriteria,
    getDefaultEvaluator,
  ])

  const showingTestCase = useMemo<boolean>(() => preloadedTestCase !== null, [preloadedTestCase])

  const [currentTestCase, setCurrentTestCase] = useState(preloadedTestCase || getEmptyTestCase(EvaluationType.DIRECT))

  const currentTestCaseString = useMemo<string>(
    () => (currentTestCase !== null && showingTestCase ? getJSONStringWithSortedKeys(currentTestCase) : ''),
    [showingTestCase, currentTestCase],
  )

  const [lastSavedUseCaseString, setLastSavedTestCaseString] = useState<string>(currentTestCaseString)

  const responses = useMemo(
    () =>
      !showingTestCase
        ? []
        : returnByPipelineType(
            currentTestCase?.type || EvaluationType.DIRECT, // right-side will never happen
            (currentTestCase?.instances as DirectInstance[]).map((instance) => instance.response),
            (currentTestCase?.instances as PairwiseInstance[]).map((instance) => instance.responses),
          ),
    [currentTestCase?.instances, currentTestCase?.type, showingTestCase],
  )

  const changesDetected = useMemo(
    () => showingTestCase && lastSavedUseCaseString !== currentTestCaseString && !isRisksAndHarms,
    [showingTestCase, lastSavedUseCaseString, currentTestCaseString, isRisksAndHarms],
  )

  const isTestCaseSaved = useMemo(() => currentTestCase !== null && currentTestCase.id !== null, [currentTestCase])

  const currentProviderCredentials = useMemo(
    () =>
      showingTestCase && currentTestCase.evaluator ? getProviderCredentials(currentTestCase.evaluator?.provider) : {},
    [currentTestCase, getProviderCredentials, showingTestCase],
  )

  const currentGenerationProviderCredentials = useMemo(
    () =>
      showingTestCase && currentTestCase.syntheticGenerationConfig.evaluator
        ? getProviderCredentials(currentTestCase.syntheticGenerationConfig.evaluator?.provider)
        : {},
    [currentTestCase, getProviderCredentials, showingTestCase],
  )

  const areRelevantCredentialsProvided = useMemo(
    () =>
      showingTestCase &&
      currentTestCase.evaluator !== null &&
      modelProviderCredentials[currentTestCase.evaluator.provider] &&
      getAreRelevantCredentialsProvided(currentTestCase.evaluator.provider),
    [currentTestCase, getAreRelevantCredentialsProvided, modelProviderCredentials, showingTestCase],
  )

  const [selectedInstance, setSelectedInstance] = useState<Instance | null>(null)

  const getStringifiedInstanceContent = useCallback(
    (instance: Instance) => {
      return getJSONStringWithSortedKeys({
        evaluator: currentTestCase.evaluator,
        criteria: currentTestCase.criteria,
        ...instance.contextVariables,
        response: returnByPipelineType(
          currentTestCase.type,
          () => (instance as DirectInstance).response,
          (instance as PairwiseInstance).responses,
        ),
      })
    },
    [currentTestCase],
  )

  // Used to compute if an instance result is outdated
  const [instancesLastEvaluatedContent, setInstancesLastEvaluatedContent] = useState<Record<string, string | null>>(
    () =>
      currentTestCase
        ? Object.fromEntries(
            currentTestCase.instances.map((instance) => [instance.id, getStringifiedInstanceContent(instance)]),
          )
        : {},
  )

  const isInstanceResultOutdated = useMemo<Record<string, boolean>>(() => {
    return currentTestCase
      ? Object.fromEntries(
          currentTestCase.instances.map((instance) => [
            instance.id,
            instance.result === null ||
              instancesLastEvaluatedContent[instance.id] !== getStringifiedInstanceContent(instance),
          ]),
        )
      : {}
  }, [currentTestCase, getStringifiedInstanceContent, instancesLastEvaluatedContent])

  const outdatedResultInstanceIds = useMemo(
    () => Object.keys(isInstanceResultOutdated).filter((i) => isInstanceResultOutdated[i]),
    [isInstanceResultOutdated],
  )

  useEffect(() => {
    if (preloadedTestCase !== null) {
      setCurrentTestCase(preloadedTestCase)
    }
  }, [preloadedTestCase])

  // update the state if the preloaded test case changes
  useEffect(() => {
    if (preloadedTestCase !== null) {
      setTestCaseSelected(null)
      setCurrentTestCase({ ...preloadedTestCase })
      setLastSavedTestCaseString(getJSONStringWithSortedKeys(preloadedTestCase))
      // temporaryIdRef.current = uuid()
    }
  }, [preloadedTestCase, setCurrentTestCase])

  return (
    <CurrentTestCaseContext.Provider
      value={{
        preloadedTestCase,
        currentTestCase,
        setCurrentTestCase,
        showingTestCase,
        responses,
        currentTestCaseString,
        lastSavedUseCaseString,
        setLastSavedTestCaseString,
        changesDetected,
        isTestCaseSaved,
        testCaseSelected,
        setTestCaseSelected,
        areRelevantCredentialsProvided,
        currentProviderCredentials,
        currentGenerationProviderCredentials,
        selectedInstance,
        setSelectedInstance,
        getStringifiedInstanceContent,
        instancesLastEvaluatedContent,
        setInstancesLastEvaluatedContent,
        outdatedResultInstanceIds,
        isInstanceResultOutdated,
      }}
    >
      {children}
    </CurrentTestCaseContext.Provider>
  )
}
