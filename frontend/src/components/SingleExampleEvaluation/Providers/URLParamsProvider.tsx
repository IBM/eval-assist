import { stringifyQueryParams, toSnakeCase } from 'src/utils'

import { ReactNode, createContext, useCallback, useContext, useMemo } from 'react'

import { useRouter } from 'next/router'

import { EvaluationType, TestCase } from '../../../types'

interface URLInfoContextValue {
  useCaseId: number | null
  useCaseType: EvaluationType | null
  libraryTestCaseName: string | null
  isRisksAndHarms: boolean
  subCatalogName: string | null
  syntheticGenerationEnabled: boolean
  criteriaName: string | null
  changeTestCaseURL: (
    queryParams:
      | {
          key: string
          value: string
        }[]
      | null,
  ) => Promise<boolean>
}

const URLParamsContext = createContext<URLInfoContextValue>({
  useCaseId: null,
  useCaseType: null,
  libraryTestCaseName: null,
  isRisksAndHarms: false,
  subCatalogName: null,
  syntheticGenerationEnabled: true,
  criteriaName: null,
  changeTestCaseURL: () => Promise.resolve(true),
})

export const useURLParamsContext = () => {
  return useContext(URLParamsContext)
}

export const URLParamsProvider = ({ children }: { children: ReactNode }) => {
  const router = useRouter()

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

  const syntheticGenerationEnabled = useMemo(
    () => (router.query.sge ? router.query.sge === 'true' : true),
    [router.query.sge],
  )

  const changeTestCaseURL = useCallback(
    (queryParams: { key: string; value: string }[] | null) => {
      if (queryParams !== null) {
        const paramsString = stringifyQueryParams(queryParams)
        return router.push(`/${paramsString}`, `/${paramsString}`, {
          shallow: true,
        })
      } else {
        return router.push({ pathname: '/' }, `/`, { shallow: true })
      }
    },
    [router],
  )

  return (
    <URLParamsContext.Provider
      value={{
        useCaseId,
        useCaseType,
        libraryTestCaseName,
        isRisksAndHarms,
        subCatalogName,
        syntheticGenerationEnabled,
        criteriaName,
        changeTestCaseURL,
      }}
    >
      {children}
    </URLParamsContext.Provider>
  )
}
