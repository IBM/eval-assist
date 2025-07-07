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

import { useFetchUtils } from '@customHooks/useFetchUtils'
import { useGetQueryParamsFromTestCase } from '@customHooks/useGetQueryParamsFromTestCase'
import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'

import {
  CriteriaWithOptions,
  DirectInstance,
  EvaluationType,
  Evaluator,
  Instance,
  ModelProviderType,
  PairwiseInstance,
  TestCase,
} from '../types'
import { useCriteriasContext } from './CriteriaProvider'
import { useEvaluatorOptionsContext } from './EvaluatorOptionsProvider'
import { useModelProviderCredentials } from './ModelProviderCredentialsProvider'
import { useURLParamsContext } from './URLParamsProvider'
import { useUserTestCasesContext } from './UserTestCasesProvider'

interface CurrentTestCaseContextValue {
  currentTestCase: TestCase
  setCurrentTestCase: (value: SetStateAction<TestCase>) => void
  preloadedTestCase: TestCase | null
  showingTestCase: boolean
  responses: string[] | string[][]
  currentTestCaseString: string
  lastSavedTestCaseString: string
  setLastSavedTestCaseString: Dispatch<SetStateAction<string>>
  changesDetected: boolean
  isTestCaseSaved: boolean
  testCaseSelected: {
    testCase: TestCase
    subCatalogName: string | null
  } | null
  setTestCaseSelected: Dispatch<
    SetStateAction<{
      testCase: TestCase
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
  updateURLFromTestCase: (
    testCaseSelected: {
      testCase: TestCase
      subCatalogName: string | null
    } | null,
  ) => void
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
  lastSavedTestCaseString: '',
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
  updateURLFromTestCase: () => {},
})

export const useCurrentTestCase = () => {
  return useContext(CurrentTestCaseContext)
}

export const CurrentTestCaseProvider = ({ children }: { children: ReactNode }) => {
  const {
    isRisksAndHarms,
    testCaseType,
    testCaseId,
    subCatalogName,
    libraryTestCaseName,
    criteriaName,
    syntheticGenerationEnabled,
    changeTestCaseURL,
  } = useURLParamsContext()
  const { modelProviderCredentials, getAreRelevantCredentialsProvided, getProviderCredentials } =
    useModelProviderCredentials()
  const { getEmptyTestCaseWithCriteria } = useCriteriasContext()
  const { directEvaluators, pairwiseEvaluators } = useEvaluatorOptionsContext()
  const { userTestCases: userTestCases } = useUserTestCasesContext()
  const { allLibraryTestCases: allLibraryTestCases, harmsAndRisksLibraryTestCases } = useTestCaseLibrary()
  const { post } = useFetchUtils()

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
        const azureCredentialsExist = getAreRelevantCredentialsProvided(ModelProviderType.AZURE)
        const defaultProvider = watsonxCredentialsExist
          ? ModelProviderType.WATSONX
          : ritsCredentialsExist
          ? ModelProviderType.RITS
          : openaiCredentialsExist
          ? ModelProviderType.OPENAI
          : azureCredentialsExist
          ? ModelProviderType.AZURE
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
      testCaseType,
    ],
  )

  const [testCaseSelected, setTestCaseSelected] = useState<{
    testCase: TestCase
    subCatalogName: string | null
  } | null>(null)

  const preloadedTestCase = useMemo(() => {
    let pu: TestCase | null
    if (testCaseId !== null && userTestCases !== null) {
      pu = userTestCases.find((userTestCase) => userTestCase.id === testCaseId) || null
    } else if (libraryTestCaseName !== null && testCaseType !== null) {
      if (isRisksAndHarms && subCatalogName !== null) {
        pu =
          harmsAndRisksLibraryTestCases[subCatalogName].find(
            (libraryTestCase) => libraryTestCase.name === libraryTestCaseName,
          ) || null
      } else {
        pu =
          allLibraryTestCases.find(
            (libraryTestCase) => libraryTestCase.name === libraryTestCaseName && libraryTestCase.type === testCaseType,
          ) || null
      }
    } else if (testCaseType !== null && testCaseId === null && libraryTestCaseName === null) {
      if (criteriaName !== null) {
        pu = getEmptyTestCaseWithCriteria(criteriaName, testCaseType)
      } else {
        pu = getEmptyTestCase(testCaseType)
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
      if (pu.type === EvaluationType.DIRECT) {
        if (pu.syntheticGenerationConfig.perCriteriaOptionCount === null) {
          pu.syntheticGenerationConfig.perCriteriaOptionCount = Object.fromEntries(
            (pu.criteria as CriteriaWithOptions).options.map((option) => [option.name, 1]),
          )
        }
        if (pu.syntheticGenerationConfig.borderlineCount === null) {
          pu.syntheticGenerationConfig.borderlineCount = 1
        }
      }
    }

    return pu
  }, [
    testCaseId,
    userTestCases,
    libraryTestCaseName,
    testCaseType,
    isRisksAndHarms,
    subCatalogName,
    harmsAndRisksLibraryTestCases,
    allLibraryTestCases,
    criteriaName,
    getEmptyTestCaseWithCriteria,
    getDefaultEvaluator,
  ])

  const showingTestCase = useMemo<boolean>(() => preloadedTestCase !== null, [preloadedTestCase])

  const [currentTestCase, setCurrentTestCase] = useState(preloadedTestCase || getEmptyTestCase(EvaluationType.DIRECT))

  const currentTestCaseString = useMemo<string>(
    () => (currentTestCase !== null && showingTestCase ? getJSONStringWithSortedKeys(currentTestCase) : ''),
    [showingTestCase, currentTestCase],
  )

  const [lastSavedTestCaseString, setLastSavedTestCaseString] = useState<string>(currentTestCaseString)

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
    () => showingTestCase && lastSavedTestCaseString !== currentTestCaseString && !isRisksAndHarms,
    [showingTestCase, lastSavedTestCaseString, currentTestCaseString, isRisksAndHarms],
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
      setCurrentTestCase({ ...preloadedTestCase })
      setTestCaseSelected(null)
      setLastSavedTestCaseString(getJSONStringWithSortedKeys(preloadedTestCase))
    }
  }, [preloadedTestCase])

  useEffect(() => {
    if (showingTestCase) {
      post('log_user_action/', {
        action: 'enter_test_case',
        content: {
          name: currentTestCase.name,
          syntheticGenerationEnabled,
        },
      })
    }
  }, [currentTestCase.name, post, showingTestCase, syntheticGenerationEnabled])

  const { getQueryParamsFromTestCase } = useGetQueryParamsFromTestCase()

  const updateURLFromTestCase = useCallback(
    (testCaseSelected: { testCase: TestCase; subCatalogName: string | null } | null) => {
      let urlChangePromise: Promise<boolean>
      if (testCaseSelected !== null) {
        // test case is a saved user test case
        urlChangePromise = changeTestCaseURL(
          getQueryParamsFromTestCase(testCaseSelected.testCase, testCaseSelected.subCatalogName),
        )
      }
    },
    [changeTestCaseURL, getQueryParamsFromTestCase],
  )

  return (
    <CurrentTestCaseContext.Provider
      value={{
        preloadedTestCase,
        currentTestCase,
        setCurrentTestCase,
        showingTestCase,
        responses,
        currentTestCaseString,
        lastSavedTestCaseString,
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
        updateURLFromTestCase,
      }}
    >
      {children}
    </CurrentTestCaseContext.Provider>
  )
}
