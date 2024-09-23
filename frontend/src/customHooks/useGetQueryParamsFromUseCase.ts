import { use, useCallback, useMemo } from 'react'

import { UseCase } from '@types'

import { useLibraryTestCases } from './useLibraryTestCases'

export const useGetQueryParamsFromUseCase = () => {
  const { risksAndHarmsLibraryTestCases } = useLibraryTestCases()
  const risksAndHarmsLibraryTestCasesNames = useMemo<string[]>(
    () =>
      Object.values(risksAndHarmsLibraryTestCases).reduce<string[]>(
        (acc, item, index) => [...acc, ...item.map((i) => i.name)],
        [],
      ),
    [risksAndHarmsLibraryTestCases],
  )

  const getQueryParamsFromUseCase = useCallback(
    (useCase: UseCase) => {
      let params: { key: string; value: string }[] = []
      if (useCase.id !== null) {
        params = [{ key: 'id', value: `${useCase.id}` }]
      } else {
        if (useCase.name !== '') {
          params.push({ key: 'libraryTestCase', value: useCase.name })
          params.push({ key: 'type', value: useCase.type })
        } else {
          // used when redirected from benchmarks and test case doesnt exist in catalog
          params.push({ key: 'type', value: useCase.type })
        }
        if (risksAndHarmsLibraryTestCasesNames.includes(useCase.name)) {
          params.push({ key: 'isRisksAndHarms', value: 'true' })
        }
      }
      return params
    },
    [risksAndHarmsLibraryTestCasesNames],
  )

  return { getQueryParamsFromUseCase }
}
