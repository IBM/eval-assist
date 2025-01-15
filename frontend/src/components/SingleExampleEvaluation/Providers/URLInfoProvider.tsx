import { ReactNode, createContext, useContext, useMemo } from 'react'

import { useRouter } from 'next/router'

import { useCriterias } from '@customHooks/useCriterias'
import { useModelProviderCredentials } from '@customHooks/useModelProviderCredentials'
import { useTestCaseLibrary } from '@customHooks/useTestCaseLibrary'
import { useWhyDidYouUpdate } from '@customHooks/useWhyDidYouUpdate'
import { getEmptyUseCase, returnByPipelineType } from '@utils/utils'

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
    if (pu !== null && rubricPipelines !== null && pairwisePipelines !== null && !pu.evaluator) {
      if (isRisksAndHarms) {
        pu = {
          ...pu,
          evaluator: rubricPipelines.find((p) => p.name === 'Granite Guardian 3.0 8B') as Evaluator,
        }
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
        pu = {
          ...pu,
          evaluator: returnByPipelineType(
            pu.type,
            rubricPipelines.find(
              (p) => p.name.toLowerCase().includes(defaultEvaluatorKeyword) && p.provider === defaultProvider,
            ) as Evaluator,
            pairwisePipelines.find(
              (p) => p.name.toLowerCase().includes(defaultEvaluatorKeyword) && p.provider === defaultProvider,
            ) as Evaluator,
          ),
        }
      }
    }

    if (pu !== null && !pu.expectedResults) {
      pu = {
        ...pu,
        expectedResults: new Array(pu.responses.length).fill(''),
      }
    }
    return pu
  }, [
    useCaseId,
    userUseCases,
    libraryTestCaseName,
    useCaseType,
    rubricPipelines,
    pairwisePipelines,
    isRisksAndHarms,
    subCatalogName,
    harmsAndRisksLibraryTestCases,
    allLibraryUseCases,
    criteriaName,
    getEmptyUseCaseWithCriteria,
    // getAreRelevantCredentialsProvided,
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
