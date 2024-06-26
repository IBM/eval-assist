import { libraryUseCases } from 'src/libraries/UseCaseLibrary'

import { useMemo } from 'react'

import { usePipelineTypesContext } from '@components/SingleExampleEvaluation/Providers/PipelineTypesProvider'
import { PipelineType } from '@utils/types'

export const useLibraryTestCases = () => {
  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()
  const rubricLibraryTestCases = useMemo(
    () =>
      libraryUseCases
        .filter((u) => u.type === PipelineType.RUBRIC)
        .map((u) =>
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
      libraryUseCases
        .filter((u) => u.type === PipelineType.PAIRWISE)
        .map((u) =>
          pairwisePipelines !== null && pairwisePipelines.length > 0
            ? {
                ...u,
                pipeline: pairwisePipelines[0],
              }
            : u,
        ),
    [pairwisePipelines],
  )

  return { rubricLibraryTestCases, pairwiseLibraryTestCases, libraryUseCases }
}
