import { useCallback, useMemo } from 'react'

import { usePipelineTypesContext } from '@components/SingleExampleEvaluation/Providers/PipelineTypesProvider'
import { StoredUseCase } from '@prisma/client'
import { Pipeline, UseCase, UseCaseV0, UseCaseV1 } from '@types'
import { returnByPipelineType } from '@utils/utils'

// EXAMPLES
// fetched use case is v0 and current is v1
// parseFetchedUseCaseV0 -> parseFetchedUseCaseV0toV1

// fetched use case is v1 and current is v1
// parseFetchedUseCaseV1

// fetched use case is v0 and current is v4
// parseFetchedUseCaseV0 -> parseFetchedUseCaseV0toV1 -> parseFetchedUseCaseV1toV2 -> parseFetchedUseCaseV2toV3 -> parseFetchedUseCaseV3toV4
// fetched use case is v3 and current is v4
// parseFetchedUseCaseV3 -> parseFetchedUseCaseV3toV4
export const useParseFetchedUseCase = () => {
  const { rubricPipelines, pairwisePipelines } = usePipelineTypesContext()

  const parseFetchedUseCaseV0 = useCallback((fetchedUseCase: Record<string, any>): UseCaseV0 => {
    // initial parsing function from V0
    const type = fetchedUseCase['type']
    const fetchedResults = fetchedUseCase.results
    return {
      id: fetchedUseCase.id,
      name: fetchedUseCase.name,
      type: type,
      contextVariables: fetchedUseCase.contextVariables || [{ variable: 'context', value: fetchedUseCase.context }],
      responseVariableName: fetchedUseCase.responseVariableName || 'Response',
      responses: fetchedUseCase.responses,
      criteria: returnByPipelineType(
        type,
        fetchedUseCase.criteria ||
          // for backward compatibility
          fetchedUseCase.rubric,
        fetchedUseCase.criteria,
      ),
      results: returnByPipelineType(
        type,
        fetchedResults,
        // newer pairwise results contain a ranking attribute,
        // is this are old results, discard them
        fetchedResults === null ? null : 'ranking' in fetchedResults ? fetchedResults : null,
      ),
      pipeline: fetchedUseCase.pipeline,
      expectedResults: returnByPipelineType(
        type,
        fetchedUseCase.expectedResults,
        // old usecases had 'none' as the expected result
        // set those as ''
        (fetchedUseCase.expectedResults as UseCaseV0['expectedResults'])?.map((expectedResult) =>
          new Array((fetchedUseCase.responses as UseCaseV0['responses']).length)
            .fill('')
            .map((_, i) => `${i + 1}`)
            .includes(expectedResult)
            ? expectedResult
            : '',
        ) || null,
      ),
    }
  }, [])

  // what changes in V1 is that pipelines are now an object containing all the info of the pipeline:
  // model_id: string
  // name: string
  // type: PipelineType
  // provider: ModelProviderType
  // version: string
  // instead of just a string. Thus superficially nothing changes, but if the parsed usecase is V0 we must
  // replace the pipeline attribute by looking for all the information of the pipeline based on its name
  // additionally, a name replaces the model_id
  const parseFetchedUseCaseV1 = useCallback(
    (fetchedUseCase: Record<string, any>): UseCaseV1 => parseFetchedUseCaseV0(fetchedUseCase) as UseCaseV1,
    [parseFetchedUseCaseV0],
  )

  // this version changes contextVariables from a list of {variable: string, value: string} to Record<string, string>
  const parseFetchedUseCaseV0toV1 = useCallback(
    (fetchedUseCase: UseCaseV0): UseCaseV1 => ({
      ...fetchedUseCase,
      // we are sure that by the time the usecases are being fetched
      // the pipelines have been already fetched (the provider is outer)
      // so casting them to Pipeline[] is safe
      pipeline:
        (
          returnByPipelineType<typeof rubricPipelines>(
            fetchedUseCase.type,
            rubricPipelines,
            pairwisePipelines,
          ) as Pipeline[]
        ).find((pipeline) => pipeline.model_id === fetchedUseCase.pipeline) ?? null,
    }),
    [pairwisePipelines, rubricPipelines],
  )

  const useCaseParsingVersionToVersionFunctions: any[] = useMemo(
    () => [parseFetchedUseCaseV0toV1],
    [parseFetchedUseCaseV0toV1],
  )

  const useCaseParsingVersionFunctions = useMemo(
    () => [parseFetchedUseCaseV0, parseFetchedUseCaseV1],
    [parseFetchedUseCaseV0, parseFetchedUseCaseV1],
  )

  const CURRENT_FORMAT_VERSION = useMemo(() => 1, [])

  const parseFetchedUseCase = useCallback(
    (fetchedUseCase: StoredUseCase): UseCase => {
      const toParseObj: Record<string, any> = {
        ...(fetchedUseCase.content as Record<string, any>),
        id: fetchedUseCase.id,
        name: fetchedUseCase.name,
      }

      const version = (toParseObj.contentFormatVersion as number) || 0
      const readFetchedUseCase = useCaseParsingVersionFunctions[version]

      let parsedUseCase = readFetchedUseCase(toParseObj)
      useCaseParsingVersionToVersionFunctions
        .filter((_, i) => i >= version)
        .forEach((parsingFunc, i) => {
          parsedUseCase = parsingFunc(parsedUseCase)
        })
      return parsedUseCase as UseCase
    },
    [useCaseParsingVersionFunctions, useCaseParsingVersionToVersionFunctions],
  )

  return {
    parseFetchedUseCase,
    CURRENT_FORMAT_VERSION,
  }
}
