import { harmsAndRisksLibraryTestCases } from 'src/libraries/UseCaseLibrary'

import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/router'

import { useLibraryTestCases } from '@customHooks/useLibraryTestCases'
import { useWhyDidYouUpdate } from '@customHooks/useWhyDidYouUpdate'
import { getEmptyUseCase, getEmptyUseCaseWithCriteria, returnByPipelineType } from '@utils/utils'

import { Pipeline, PipelineType, UseCase } from '../../../types'
import { usePipelineTypesContext } from './PipelineTypesProvider'
import { useUserUseCasesContext } from './UserUseCasesProvider'

interface URLInfoContextValue {
  useCaseId: number | null
  useCaseType: PipelineType | null
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

  const { allLibraryUseCases, harmsAndRisksLibraryTestCases } = useLibraryTestCases()
  const { userUseCases } = useUserUseCasesContext()
  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const useCaseId = useMemo(() => (router.query.id ? +router.query.id : null), [router.query.id])
  const useCaseType = useMemo(
    () => (router.query.type ? (router.query.type as PipelineType) : null),
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

    if (pu !== null && rubricPipelines !== null && pairwisePipelines !== null && pu.pipeline === null) {
      if (isRisksAndHarms) {
        pu = {
          ...pu,
          pipeline: rubricPipelines.find((p) => p.name === 'Granite Guardian 3.0 8B') as Pipeline,
        }
      } else {
        pu = {
          ...pu,
          pipeline: returnByPipelineType(
            pu.type,
            rubricPipelines.find((p) => p.name.includes('Mixtral')) as Pipeline,
            pairwisePipelines.find((p) => p.name.includes('Mixtral')) as Pipeline,
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
