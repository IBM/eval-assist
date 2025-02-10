import { getEmptyUseCase, returnByPipelineType } from 'src/utils'

import { ReactNode, createContext, useCallback, useContext, useMemo } from 'react'

import { useRouter } from 'next/router'

import { useCriterias } from '@customHooks/useCriterias'
import { useModelProviderCredentials } from '@customHooks/useModelProviderCredentials'
import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'

import { EvaluationType, Evaluator, ModelProviderType, UseCase } from '../../../types'
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
  const { getEmptyUseCaseWithCriteria } = useCriterias()
  const { allLibraryUseCases, harmsAndRisksLibraryTestCases } = useTestCaseLibrary()
  const { userUseCases } = useUserUseCasesContext()
  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()
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
    () => (router.query.criteriaName ? (router.query.criteriaName as string) : null),
    [router.query.criteriaName],
  )

  const getDefaultEvaluator = useCallback(
    (type: EvaluationType) => {
      if (rubricPipelines === null || pairwisePipelines === null || type === null) {
        // won't happen!
        return null
      }
      if (isRisksAndHarms) {
        return rubricPipelines.find((p) => p.name.toLocaleLowerCase().includes('granite guardian')) as Evaluator
      } else {
        const ritsCredentialsExist = getAreRelevantCredentialsProvided(ModelProviderType.RITS)
        const watsonxCredentialsExist = getAreRelevantCredentialsProvided(ModelProviderType.WATSONX)
        const openaiCredentialsExist = getAreRelevantCredentialsProvided(ModelProviderType.OPENAI)
        const defaultProvider = watsonxCredentialsExist
          ? ModelProviderType.WATSONX
          : ritsCredentialsExist
          ? ModelProviderType.RITS
          : openaiCredentialsExist
          ? ModelProviderType.OPENAI
          : ModelProviderType.RITS

        const defaultEvaluatorKeyword =
          watsonxCredentialsExist || ritsCredentialsExist || !openaiCredentialsExist ? 'llama' : 'gpt'
        return returnByPipelineType(
          type,
          rubricPipelines.find(
            (p) => p.name.toLowerCase().includes(defaultEvaluatorKeyword) && p.provider === defaultProvider,
          ) as Evaluator,
          pairwisePipelines.find(
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
      pairwisePipelines,
      rubricPipelines,
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
        console.log(pu)
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

  const defaultModelWasChosen = useMemo(() => {}, [])

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
