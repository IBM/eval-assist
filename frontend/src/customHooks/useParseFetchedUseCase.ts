import { useCallback, useMemo } from 'react'

import { useEvaluatorOptionsContext } from '@providers/EvaluatorOptionsProvider'
import { FetchedTestCase, TestCase, TestCaseV0 } from '@types'

// EXAMPLES
// fetched test case is v0 and current is v1
// parseFetchedUseCaseV0 -> parseFetchedUseCaseV0toV1

// fetched test case is v1 and current is v1
// parseFetchedUseCaseV1

// fetched test case is v0 and current is v4
// parseFetchedUseCaseV0 -> parseFetchedUseCaseV0toV1 -> parseFetchedUseCaseV1toV2 -> parseFetchedUseCaseV2toV3 -> parseFetchedUseCaseV3toV4
// fetched test case is v3 and current is v4
// parseFetchedUseCaseV3 -> parseFetchedUseCaseV3toV4
export const useParseFetchedUseCase = () => {
  const { directEvaluators, pairwiseEvaluators } = useEvaluatorOptionsContext()

  // const parseDirectAssessmentResultsV0ToV1 = useCallback((results: DirectResultsV0): DirectResultsV1 | null => {
  //   return (
  //     results?.map((r) => ({
  //       positionalBias: r.positionalBias,
  //       positionalBiasOption: '',
  //       summary: r.explanation,
  //       certainty: r.certainty,
  //       option: r.option,
  //     })) || null
  //   )
  // }, [])

  // const parsePairwiseComparisonResultsV0ToV1 = useCallback(
  //   (results: PairwiseInstanceResultV0): PairwiseInstanceResultV1 | null => {
  //     const perResponseResults: PairwiseInstanceResultV1 = {}
  //     results !== null
  //       ? Object.keys(results.perResponseResults).forEach((key) => {
  //           const r = results.perResponseResults[key]
  //           perResponseResults[key] = {
  //             positionalBias: r.positionalBias || Array(Object.keys(results.perResponseResults).length - 1).fill(false),
  //             comparedTo: r.comparedToIndexes.map((x) => `${x}`),
  //             summaries: Object.values(r.explanations),
  //             ranking: r.ranking,
  //             winrate: r.winrate,
  //             contestResults: r.contestResults,
  //           }
  //         })
  //       : null
  //     return perResponseResults
  //   },
  //   [],
  // )

  // const parseResultsV0ToV1 = useCallback(
  //   (results: ResultsV0, type: EvaluationType): ResultsV1 => {
  //     return returnByPipelineType(
  //       type,
  //       () => parseDirectAssessmentResultsV0ToV1(results as DirectResultsV0),
  //       () => parsePairwiseComparisonResultsV0ToV1(results as PairwiseInstanceResultV0),
  //     )
  //   },
  //   [parseDirectAssessmentResultsV0ToV1, parsePairwiseComparisonResultsV0ToV1],
  // )

  // const parseFetchedUseCaseV0 = useCallback((fetchedUseCase: Record<string, any>): TestCaseV0 => {
  //   const type = fetchedUseCase['type']
  //   const fetchedResults = fetchedUseCase.results
  //   return {
  //     id: fetchedUseCase.id,
  //     name: fetchedUseCase.name,
  //     type: type,
  //     contextVariables: fetchedUseCase.contextVariables || [{ name: 'context', value: fetchedUseCase.context }],
  //     responseVariableName: fetchedUseCase.responseVariableName || 'Response',
  //     responses: fetchedUseCase.responses,
  //     criteria: returnByPipelineType(
  //       type,
  //       fetchedUseCase.criteria ||
  //         // for backward compatibility
  //         fetchedUseCase.rubric,
  //       fetchedUseCase.criteria,
  //     ),
  //     results: returnByPipelineType(
  //       type,
  //       fetchedResults,
  //       // newer pairwise results contain a ranking attribute,
  //       // if this are old results, discard them
  //       fetchedResults === null ? null : 'ranking' in fetchedResults ? fetchedResults : null,
  //     ),
  //     pipeline: fetchedUseCase.pipeline,
  //     expectedResults: returnByPipelineType(
  //       type,
  //       fetchedUseCase.expectedResults,
  //       // old usecases had 'none' as the expected result
  //       // set those as ''
  //       (fetchedUseCase.expectedResults as TestCaseV0['expectedResults'])?.map((expectedResult) =>
  //         new Array((fetchedUseCase.responses as TestCaseV0['responses']).length)
  //           .fill('')
  //           .map((_, i) => `${i + 1}`)
  //           .includes(expectedResult)
  //           ? expectedResult
  //           : '',
  //       ) || null,
  //     ),
  //   }

  // // this version changes contextVariables from a list of {variable: string, value: string} to Record<string, string>
  // const parseFetchedUseCaseV0ToV1 = useCallback(
  //   (fetchedUseCase: TestCaseV0): UseCaseV1 => ({
  //     ...fetchedUseCase,
  //     // we are sure that by the time the usecases are being fetched
  //     // the pipelines have been already fetched (the provider is outer)
  //     // so casting them to Pipeline[] is safe
  //     pipeline:
  //       (
  //         returnByPipelineType<typeof directEvaluators, typeof pairwiseEvaluators>(
  //           fetchedUseCase.type,
  //           directEvaluators,
  //           pairwiseEvaluators,
  //         ) as Evaluator[]
  //       ).find((pipeline) => pipeline.name === fetchedUseCase.pipeline) ?? null,
  //   }),
  //   [pairwiseEvaluators, directEvaluators],
  // )
  // }, [])

  const parseFetchedUseCaseV0 = useCallback(
    (fetchedUseCase: Record<string, any>): TestCaseV0 =>
      ({
        ...fetchedUseCase,
        // criteria was added contextFields and predictionField, so we fill them if they are not provided
        criteria: {
          ...fetchedUseCase.criteria,
          contextFields: fetchedUseCase.criteria.contextFields || fetchedUseCase.contextVariableNames,
          predictionField: fetchedUseCase.criteria.predictionField || fetchedUseCase.responseVariableName,
        },
      } as TestCaseV0),
    [],
  )

  const useCaseParsingVersionToVersionFunctions: any[] = useMemo(() => [], [])

  const useCaseParsingVersionFunctions = useMemo(() => [parseFetchedUseCaseV0], [parseFetchedUseCaseV0])

  const CURRENT_FORMAT_VERSION = useMemo(() => 0, [])

  const parseFetchedUseCase = useCallback(
    (fetchedUseCase: FetchedTestCase): TestCase | null => {
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
      return parsedUseCase as TestCase
    },
    [CURRENT_FORMAT_VERSION, useCaseParsingVersionFunctions, useCaseParsingVersionToVersionFunctions],
  )

  return {
    parseFetchedUseCase,
    CURRENT_FORMAT_VERSION,
  }
}
