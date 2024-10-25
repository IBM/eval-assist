import {
  harmsAndRisksLibraryTestCases as _harmsAndRisksLibraryUseCases,
  pairwiseLibraryTestCases,
  rubricLibraryTestCases,
} from 'src/libraries/UseCaseLibrary'

import { useMemo } from 'react'

import { UseCase } from '@types'
import { toTitleCase } from '@utils/utils'

export const useLibraryTestCases = () => {
  const harmsAndRisksLibraryTestCases = useMemo(() => {
    let result: typeof _harmsAndRisksLibraryUseCases = {}
    Object.keys(_harmsAndRisksLibraryUseCases).forEach((k) => {
      result[k] = _harmsAndRisksLibraryUseCases[k].map((u) => {
        let parsed = { ...u }
        parsed = {
          ...parsed,
          criteria: {
            ...parsed.criteria,
            name: toTitleCase(parsed.criteria.name.split('>')[0]),
          },
        }
        return parsed
      })
    })
    return result
  }, [])

  const allLibraryUseCases = useMemo<UseCase[]>(
    () => [
      ...pairwiseLibraryTestCases,
      ...rubricLibraryTestCases,
      ...Object.values(harmsAndRisksLibraryTestCases).reduce((acc, item, index) => [...acc, ...item], []),
    ],
    [harmsAndRisksLibraryTestCases],
  )

  return {
    rubricLibraryTestCases,
    pairwiseLibraryTestCases,
    harmsAndRisksLibraryTestCases,
    allLibraryUseCases,
  }
}
