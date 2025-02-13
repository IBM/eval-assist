import { use, useCallback, useMemo } from 'react'

import { UseCase } from '@types'

import { useTestCaseLibrary } from './useTestCaseLibrary'

export const useGetQueryParamsFromUseCase = () => {
  const { harmsAndRisksLibraryTestCases } = useTestCaseLibrary()
  const harmsAndRisksLibraryTestCasesNames = useMemo<string[]>(
    () =>
      Object.values(harmsAndRisksLibraryTestCases).reduce<string[]>(
        (acc, item, index) => [...acc, ...item.map((i) => i.name)],
        [],
      ),
    [harmsAndRisksLibraryTestCases],
  )

  const getQueryParamsFromUseCase = useCallback(
    (useCase: UseCase, subCatalogName: string | null) => {
      let params: { key: string; value: string }[] = []
      if (subCatalogName) {
        params.push({ key: 'subCatalogName', value: subCatalogName })
      }
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
        if (harmsAndRisksLibraryTestCasesNames.includes(useCase.name)) {
          params.push({ key: 'isRisksAndHarms', value: 'true' })
        } else {
          params.push({ key: 'isRisksAndHarms', value: 'false' })
        }
      }
      return params
    },
    [harmsAndRisksLibraryTestCasesNames],
  )

  return { getQueryParamsFromUseCase }
}
