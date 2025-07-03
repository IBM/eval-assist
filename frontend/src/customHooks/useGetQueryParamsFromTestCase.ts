import { use, useCallback, useMemo } from 'react'

import { useURLParamsContext } from '@providers/URLParamsProvider'
import { TestCase } from '@types'

import { useTestCaseLibrary } from './useTestCaseLibrary'

export const useGetQueryParamsFromTestCase = () => {
  const { harmsAndRisksLibraryTestCases } = useTestCaseLibrary()
  const { syntheticGenerationEnabled } = useURLParamsContext()
  const harmsAndRisksLibraryTestCasesNames = useMemo<string[]>(
    () =>
      Object.values(harmsAndRisksLibraryTestCases).reduce<string[]>(
        (acc, item, index) => [...acc, ...item.map((i) => i.name)],
        [],
      ),
    [harmsAndRisksLibraryTestCases],
  )

  const getQueryParamsFromTestCase = useCallback(
    (testCase: TestCase, subCatalogName: string | null) => {
      let params: { key: string; value: string }[] = []
      if (subCatalogName) {
        params.push({ key: 'subCatalogName', value: subCatalogName })
      }
      if (testCase.id !== null) {
        params = [{ key: 'id', value: `${testCase.id}` }]
      } else {
        if (testCase.name !== '') {
          params.push({ key: 'libraryTestCase', value: testCase.name })
          params.push({ key: 'type', value: testCase.type })
        } else {
          // used when redirected from benchmarks and test case doesnt exist in catalog
          params.push({ key: 'type', value: testCase.type })
          if (testCase.criteria.name !== '') {
            params.push({ key: 'criteriaName', value: testCase.criteria.name })
          }
        }
        if (harmsAndRisksLibraryTestCasesNames.includes(testCase.name)) {
          params.push({ key: 'isRisksAndHarms', value: 'true' })
        } else {
          params.push({ key: 'isRisksAndHarms', value: 'false' })
        }
      }
      params.push({ key: 'sge', value: syntheticGenerationEnabled ? 'true' : 'false' })
      return params
    },
    [harmsAndRisksLibraryTestCasesNames, syntheticGenerationEnabled],
  )

  return { getQueryParamsFromTestCase }
}
