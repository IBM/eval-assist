import { getEmptyUseCase, returnByPipelineType, toSnakeCase } from 'src/utils'

import { ReactNode, createContext, useCallback, useContext, useMemo } from 'react'

import { useRouter } from 'next/router'

import { useModelProviderCredentials } from '@customHooks/useModelProviderCredentials'
import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'

import { EvaluationType, Evaluator, ModelProviderType, UseCase } from '../../../types'
import { useCriteriasContext } from './CriteriasProvider'
import { usePipelineTypesContext } from './PipelineTypesProvider'
import { useUserUseCasesContext } from './UserUseCasesProvider'

interface URLInfoContextValue {
  useCaseId: number | null
  useCaseType: EvaluationType | null
  libraryTestCaseName: string | null
  preloadedUseCase: UseCase | null
  isRisksAndHarms: boolean
  subCatalogName: string | null
}

const URLInfoContext = createContext<URLInfoContextValue>({
  useCaseId: null,
  useCaseType: null,
  libraryTestCaseName: null,
  preloadedUseCase: null,
  isRisksAndHarms: false,
  subCatalogName: null,
})

export const useURLInfoContext = () => {
  return useContext(URLInfoContext)
}

export const URLInfoProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()
  const { getEmptyUseCaseWithCriteria } = useCriteriasContext()
  const { allLibraryUseCases, harmsAndRisksLibraryTestCases } = useTestCaseLibrary()
  const { userUseCases } = useUserUseCasesContext()
  const { directEvaluators, pairwiseEvaluators } = usePipelineTypesContext()
  const { getAreRelevantCredentialsProvided } = useModelProviderCredentials()

  const useCaseId = useMemo(() => (router.query.id ? +router.query.id : null), [router.query.id])
  const useCaseType = useMemo(
    () => (router.query.type ? (router.query.type as EvaluationType) : null),
    [router.query.type],
  )

  const isRisksAndHarms = useMemo(
    () => (router.query.isRisksAndHarms ? router.query.isRisksAndHarms === 'true' : false),
    [router.query.isRisksAndHarms],
  )

  const subCatalogName = useMemo(() => (router.query.subCatalogName as string) || null, [router.query.subCatalogName])

  const libraryTestCaseName = useMemo(
    () => (router.query.libraryTestCase ? (router.query.libraryTestCase as string) : null),
    [router.query.libraryTestCase],
  )

  const criteriaName = useMemo(
    () => (router.query.criteriaName ? toSnakeCase(router.query.criteriaName as string) : null),
    [router.query.criteriaName],
  )

  const getDefaultEvaluator = useCallback(
    (type: EvaluationType) => {
      if (directEvaluators === null || pairwiseEvaluators === null || type === null) {
        // won't happen!
        return null
      }
      if (isRisksAndHarms) {
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
            ? 'llama'
            : 'gpt'
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

  const preloadedUseCase = useMemo(() => {
    let pu: UseCase | null
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
        pu = getEmptyUseCase(useCaseType)
      }
    } else {
      pu = null
    }
    if (pu !== null && !pu.evaluator) {
      pu = { ...pu, evaluator: getDefaultEvaluator(pu.type) }
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

  return (
    <URLInfoContext.Provider
      value={{
        useCaseId,
        useCaseType,
        libraryTestCaseName,
        preloadedUseCase,
        isRisksAndHarms,
        subCatalogName,
      }}
    >
      {children}
    </URLInfoContext.Provider>
  )
}
