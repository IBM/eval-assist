import { Dispatch, ReactNode, SetStateAction, createContext, useContext, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/router'

import { useLibraryTestCases } from '@customHooks/useLibraryTestCases'
import { getEmptyUseCase, returnByPipelineType } from '@utils/utils'

import { PipelineType, UseCase } from '../types'
import { usePipelineTypesContext } from './PipelineTypesProvider'
import { useUserUseCasesContext } from './UserUseCasesProvider'

interface URLInfoContextValue {
  useCaseId: number | null
  useCaseType: PipelineType | null
  libraryTestCaseName: string | null
  preloadedUseCase: UseCase | null
}

const URLInfoContext = createContext<URLInfoContextValue>({
  useCaseId: null,
  useCaseType: null,
  libraryTestCaseName: null,
  preloadedUseCase: null,
})

export const useURLInfoContext = () => {
  return useContext(URLInfoContext)
}

export const URLInfoProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()

  const { libraryUseCases } = useLibraryTestCases()
  const { userUseCases } = useUserUseCasesContext()
  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const useCaseId = useMemo(() => (router.query.id ? +router.query.id : null), [router.query.id])
  const useCaseType = useMemo(
    () => (router.query.type ? (router.query.type as PipelineType) : null),
    [router.query.type],
  )
  const libraryTestCaseName = useMemo(
    () => (router.query.libraryTestCase ? (router.query.libraryTestCase as string) : null),
    [router.query.libraryTestCase],
  )

  const preloadedUseCase = useMemo(() => {
    console.log('here')
    let pu: UseCase | null
    if (useCaseId !== null && userUseCases !== null) {
      pu = userUseCases.find((userUseCase) => userUseCase.id === useCaseId) || null
    } else if (libraryTestCaseName !== null && useCaseType !== null) {
      pu =
        libraryUseCases.find(
          (libraryUseCase) => libraryUseCase.name === libraryTestCaseName && libraryUseCase.type === useCaseType,
        ) || null
    } else if (useCaseType !== null && useCaseId === null && libraryTestCaseName === null) {
      pu = getEmptyUseCase(useCaseType)
    } else {
      pu = null
    }

    if (pu !== null && rubricPipelines !== null && pairwisePipelines !== null) {
      pu = {
        ...pu,
        pipeline: returnByPipelineType(pu?.type, rubricPipelines[0], pairwisePipelines[0]),
      }
    }

    return pu
  }, [useCaseId, userUseCases, libraryTestCaseName, useCaseType, rubricPipelines, pairwisePipelines, libraryUseCases])

  return (
    <URLInfoContext.Provider
      value={{
        useCaseId,
        useCaseType,
        libraryTestCaseName,
        preloadedUseCase,
      }}
    >
      {children}
    </URLInfoContext.Provider>
  )
}
