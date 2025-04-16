import { useCallback, useMemo } from 'react'

import { usePipelineTypesContext } from '@components/SingleExampleEvaluation/Providers/PipelineTypesProvider'
import { StoredUseCase } from '@prisma/client'
import {
  CriteriaV1,
  CriteriaWithOptionsV0,
  CriteriaWithOptionsV1,
  DirectInstance,
  DirectResultsV0,
  DirectResultsV1,
  EvaluationType,
  Evaluator,
  ModelProviderType,
  PairwiseInstance,
  PairwiseInstanceResultV0,
  PairwiseInstanceResultV1,
  ResultsV0,
  ResultsV1,
  TaskEnum,
  UseCase,
  UseCaseV0,
  UseCaseV1,
  UseCaseV2,
  UseCaseV3,
  UseCaseV4,
} from '@types'
import { returnByPipelineType } from '@utils'

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
  const { directEvaluators, pairwiseEvaluators } = usePipelineTypesContext()

  const parseDirectAssessmentResultsV0ToV1 = useCallback((results: DirectResultsV0): DirectResultsV1 | null => {
    return (
      results?.map((r) => ({
        positionalBias: r.positionalBias,
        positionalBiasOption: '',
        summary: r.explanation,
        certainty: r.certainty,
        option: r.option,
      })) || null
    )
  }, [])

  const parsePairwiseComparisonResultsV0ToV1 = useCallback(
    (results: PairwiseInstanceResultV0): PairwiseInstanceResultV1 | null => {
      const perResponseResults: PairwiseInstanceResultV1 = {}
      results !== null
        ? Object.keys(results.perResponseResults).forEach((key) => {
            const r = results.perResponseResults[key]
            perResponseResults[key] = {
              positionalBias: r.positionalBias || Array(Object.keys(results.perResponseResults).length - 1).fill(false),
              comparedTo: r.comparedToIndexes.map((x) => `${x}`),
              summaries: Object.values(r.explanations),
              ranking: r.ranking,
              winrate: r.winrate,
              contestResults: r.contestResults,
            }
          })
        : null
      return perResponseResults
    },
    [],
  )

  const parseResultsV0ToV1 = useCallback(
    (results: ResultsV0, type: EvaluationType): ResultsV1 => {
      return returnByPipelineType(
        type,
        () => parseDirectAssessmentResultsV0ToV1(results as DirectResultsV0),
        () => parsePairwiseComparisonResultsV0ToV1(results as PairwiseInstanceResultV0),
      )
    },
    [parseDirectAssessmentResultsV0ToV1, parsePairwiseComparisonResultsV0ToV1],
  )

  const parseFetchedUseCaseV0 = useCallback((fetchedUseCase: Record<string, any>): UseCaseV0 => {
    const type = fetchedUseCase['type']
    const fetchedResults = fetchedUseCase.results
    return {
      id: fetchedUseCase.id,
      name: fetchedUseCase.name,
      type: type,
      contextVariables: fetchedUseCase.contextVariables || [{ name: 'context', value: fetchedUseCase.context }],
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
        // if this are old results, discard them
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

  const parseFetchedUseCaseV2 = useCallback((fetchedUseCase: Record<string, any>): UseCaseV2 => {
    // console.log(fetchedUseCase)
    return {
      ...fetchedUseCase,
      type: returnByPipelineType(fetchedUseCase.type, EvaluationType.DIRECT, EvaluationType.PAIRWISE),
    } as UseCaseV2
  }, [])

  const parseFetchedUseCaseV3 = useCallback(
    (fetchedUseCase: Record<string, any>): UseCaseV3 =>
      ({
        ...fetchedUseCase,
      } as UseCaseV3),
    [],
  )

  const parseFetchedUseCaseV4 = useCallback(
    (fetchedUseCase: Record<string, any>): UseCaseV4 =>
      ({
        ...fetchedUseCase,
      } as UseCaseV4),
    [],
  )

  // this version changes contextVariables from a list of {variable: string, value: string} to Record<string, string>
  const parseFetchedUseCaseV0ToV1 = useCallback(
    (fetchedUseCase: UseCaseV0): UseCaseV1 => ({
      ...fetchedUseCase,
      // we are sure that by the time the usecases are being fetched
      // the pipelines have been already fetched (the provider is outer)
      // so casting them to Pipeline[] is safe
      pipeline:
        (
          returnByPipelineType<typeof directEvaluators, typeof pairwiseEvaluators>(
            fetchedUseCase.type,
            directEvaluators,
            pairwiseEvaluators,
          ) as Evaluator[]
        ).find((pipeline) => pipeline.name === fetchedUseCase.pipeline) ?? null,
    }),
    [pairwiseEvaluators, directEvaluators],
  )

  /*
  Many things change from V1 to V2:
  - pipeline was renamed to evaluator (bam was removed)
  - criteria fields were renamed
  - positionalBiasOption was added to the DA results
  - explanations were renamed to summaries
  - comparedToIndexes were renamed to comparedTo
  - p_bias was renamed to positional_bias
  - results was renamed to perResponseResults in fetched PC results
  - 
  */
  const parseFetchedUseCaseV1ToV2 = useCallback(
    (useCaseV1: UseCaseV1): UseCaseV2 => {
      const type = returnByPipelineType(useCaseV1.type, EvaluationType.DIRECT, EvaluationType.PAIRWISE)
      // @ts-ignore
      const evaluator = useCaseV1.pipeline?.provider === 'bam' ? null : useCaseV1.pipeline
      const useCaseV2 = {
        id: useCaseV1.id,
        name: useCaseV1.name,
        type: type,
        contextVariables: useCaseV1.contextVariables,
        responseVariableName: useCaseV1.responseVariableName,
        responses: useCaseV1.responses,
        evaluator: evaluator,
        expectedResults: useCaseV1.expectedResults,
        results: parseResultsV0ToV1(useCaseV1.results, type),
        criteria: returnByPipelineType<CriteriaWithOptionsV1, CriteriaV1>(
          type,
          () => ({
            name: useCaseV1.criteria.name,
            description: useCaseV1.criteria.criteria,
            options: (useCaseV1.criteria as CriteriaWithOptionsV0).options.map((o) => ({
              name: o.option,
              description: o.description,
            })),
          }),
          () => ({ name: useCaseV1.criteria.name, description: useCaseV1.criteria.criteria }),
        ),
      }
      return useCaseV2
    },
    [parseResultsV0ToV1],
  )

  const parseFetchedUseCaseV2ToV3 = useCallback((useCaseV2: UseCaseV2): UseCaseV3 => {
    const type = returnByPipelineType(useCaseV2.type, EvaluationType.DIRECT, EvaluationType.PAIRWISE)
    // @ts-ignore
    const evaluator = useCaseV2.pipeline?.provider === 'bam' ? null : useCaseV2.pipeline
    // console.log(useCaseV2.name)
    const contextVariables = useCaseV2.contextVariables.map((oldContextVariable) => ({
      name: oldContextVariable.variable,
      value: oldContextVariable.value,
    }))

    const useCaseV3 = {
      id: useCaseV2.id,
      name: useCaseV2.name,
      type: type,
      evaluator: evaluator,
      criteria: useCaseV2.criteria,
      responseVariableName: useCaseV2.responseVariableName,
      instances: returnByPipelineType(
        type,
        () =>
          useCaseV2.responses.map(
            (response, i) =>
              ({
                contextVariables,
                expectedResult: useCaseV2.expectedResults ? useCaseV2.expectedResults[i] : '',
                response,
                result: (useCaseV2.results as DirectResultsV1) ? (useCaseV2.results as DirectResultsV1)[i] : null,
              } as DirectInstance),
          ),
        () => [
          {
            contextVariables,
            expectedResult: useCaseV2.expectedResults || '',
            responses: useCaseV2.responses,
            result: useCaseV2.results as PairwiseInstanceResultV1,
          } as PairwiseInstance,
        ],
      ),
    }
    return useCaseV3
  }, [])

  const parseFetchedUseCaseV3ToV4 = useCallback((useCaseV3: UseCaseV3): UseCaseV4 => {
    const useCaseV4: UseCaseV4 = {
      ...useCaseV3,
      syntheticGenerationConfig: {
        task: TaskEnum.TextGeneration,
        domain: null,
        persona: null,
        generationLength: null,
        evaluator: null,
        perCriteriaOptionCount: null,
        borderlineCount: null,
      },
    }
    return useCaseV4
  }, [])

  const useCaseParsingVersionToVersionFunctions: any[] = useMemo(
    () => [parseFetchedUseCaseV0ToV1, parseFetchedUseCaseV1ToV2, parseFetchedUseCaseV2ToV3, parseFetchedUseCaseV3ToV4],
    [parseFetchedUseCaseV0ToV1, parseFetchedUseCaseV1ToV2, parseFetchedUseCaseV2ToV3, parseFetchedUseCaseV3ToV4],
  )

  const useCaseParsingVersionFunctions = useMemo(
    () => [
      parseFetchedUseCaseV0,
      parseFetchedUseCaseV1,
      parseFetchedUseCaseV2,
      parseFetchedUseCaseV3,
      parseFetchedUseCaseV4,
    ],
    [parseFetchedUseCaseV0, parseFetchedUseCaseV1, parseFetchedUseCaseV2, parseFetchedUseCaseV3, parseFetchedUseCaseV4],
  )

  const CURRENT_FORMAT_VERSION = useMemo(() => 4, [])

  const parseFetchedUseCase = useCallback(
    (fetchedUseCase: StoredUseCase): UseCase | null => {
      const toParseObj: Record<string, any> = {
        ...JSON.parse(fetchedUseCase.content),
        id: fetchedUseCase.id,
        name: fetchedUseCase.name,
      }

      const version = (toParseObj.contentFormatVersion as number) || 0
      if (version > CURRENT_FORMAT_VERSION) {
        console.log(`Discarding test case ${fetchedUseCase.name} because its newer than the current system version.`)
        return null
      }
      const readFetchedUseCase = useCaseParsingVersionFunctions[version]

      let parsedUseCase = readFetchedUseCase(toParseObj)
      useCaseParsingVersionToVersionFunctions
        .filter((_, i) => i >= version)
        .forEach((parsingFunc, i) => {
          parsedUseCase = parsingFunc(parsedUseCase)
        })
      return parsedUseCase as UseCase
    },
    [CURRENT_FORMAT_VERSION, useCaseParsingVersionFunctions, useCaseParsingVersionToVersionFunctions],
  )

  return {
    parseFetchedUseCase,
    CURRENT_FORMAT_VERSION,
  }
}
