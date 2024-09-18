import {
  pairwiseLibraryUseCases as _pairwiseLibraryUseCases,
  rubricLibraryUseCases as _rubricLibraryUseCases,
} from 'src/libraries/UseCaseLibrary'

import { useMemo } from 'react'

import { usePipelineTypesContext } from '@components/SingleExampleEvaluation/Providers/PipelineTypesProvider'
import { UseCase } from '@types'

export const useLibraryTestCases = () => {
  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const rubricLibraryTestCases = useMemo(() => {
    let result: typeof _rubricLibraryUseCases = {}
    Object.keys(_rubricLibraryUseCases).forEach((k) => {
      result[k] = _rubricLibraryUseCases[k].map((u) =>
        rubricPipelines !== null && rubricPipelines.length > 0
          ? {
              ...u,
              pipeline: rubricPipelines[0],
            }
          : u,
      )
    })
    return result
  }, [rubricPipelines])

  const pairwiseLibraryTestCases = useMemo(
    () =>
      _pairwiseLibraryUseCases.map((u) =>
        pairwisePipelines !== null && pairwisePipelines.length > 0
          ? {
              ...u,
              pipeline: pairwisePipelines[0],
            }
          : u,
      ),
    [pairwisePipelines],
  )

  const allLibraryUseCases = useMemo<UseCase[]>(
    () => [
      ...pairwiseLibraryTestCases,
      ...Object.values(rubricLibraryTestCases).reduce((acc, item, index) => [...acc, ...item], []),
    ],
    [pairwiseLibraryTestCases, rubricLibraryTestCases],
  )

  return { rubricLibraryTestCases, pairwiseLibraryTestCases, allLibraryUseCases }
}
