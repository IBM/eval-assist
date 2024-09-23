import {
  pairwiseLibraryUseCases as _pairwiseLibraryUseCases,
  risksAndHarmsLibraryUseCases as _risksAndHarmsLibraryUseCases,
  rubricLibraryUseCases as _rubricLibraryUseCases,
} from 'src/libraries/UseCaseLibrary'

import { useMemo } from 'react'

import { usePipelineTypesContext } from '@components/SingleExampleEvaluation/Providers/PipelineTypesProvider'
import { Pipeline, UseCase } from '@types'

export const useLibraryTestCases = () => {
  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const risksAndHarmsLibraryTestCases = useMemo(() => {
    let result: typeof _risksAndHarmsLibraryUseCases = {}
    Object.keys(_risksAndHarmsLibraryUseCases).forEach((k) => {
      result[k] = _risksAndHarmsLibraryUseCases[k].map((u) =>
        rubricPipelines !== null && rubricPipelines.length > 0
          ? {
              ...u,
              pipeline: rubricPipelines.find((p) => p.name === 'Granite Guardian') as Pipeline,
            }
          : u,
      )
    })
    return result
  }, [rubricPipelines])

  const rubricLibraryTestCases = useMemo(
    () =>
      _rubricLibraryUseCases.map((u) =>
        rubricPipelines !== null && rubricPipelines.length > 0
          ? {
              ...u,
              pipeline: rubricPipelines[0],
            }
          : u,
      ),
    [rubricPipelines],
  )

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
      ...rubricLibraryTestCases,
      ...Object.values(risksAndHarmsLibraryTestCases).reduce((acc, item, index) => [...acc, ...item], []),
    ],
    [pairwiseLibraryTestCases, risksAndHarmsLibraryTestCases, rubricLibraryTestCases],
  )

  return { rubricLibraryTestCases, pairwiseLibraryTestCases, risksAndHarmsLibraryTestCases, allLibraryUseCases }
}
