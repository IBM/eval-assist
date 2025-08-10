import { useCallback, useMemo } from 'react'

import { useEvaluatorOptionsContext } from '@providers/EvaluatorOptionsProvider'
import { FetchedTestCase, TestCase, TestCaseV0, TestCaseV1 } from '@types'

// EXAMPLES
// fetched test case is v0 and current is v1
// parseFetchedTestCaseV0 -> parseFetchedTestCaseV0toV1

// fetched test case is v1 and current is v1
// parseFetchedTestCaseV1

// fetched test case is v0 and current is v4
// parseFetchedTestCaseV0 -> parseFetchedTestCaseV0toV1 -> parseFetchedTestCaseV1toV2 -> parseFetchedTestCaseV2toV3 -> parseFetchedTestCaseV3toV4
// fetched test case is v3 and current is v4
// parseFetchedTestCaseV3 -> parseFetchedTestCaseV3toV4
export const useParseFetchedTestCase = () => {
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

  // const parseFetchedTestCaseV0 = useCallback((fetchedTestCase: Record<string, any>): TestCaseV0 => {
  //   const type = fetchedTestCase['type']
  //   const fetchedResults = fetchedTestCase.results
  //   return {
  //     id: fetchedTestCase.id,
  //     name: fetchedTestCase.name,
  //     type: type,
  //     contextVariables: fetchedTestCase.contextVariables || [{ name: 'context', value: fetchedTestCase.context }],
  //     responseVariableName: fetchedTestCase.responseVariableName || 'Response',
  //     responses: fetchedTestCase.responses,
  //     criteria: returnByPipelineType(
  //       type,
  //       fetchedTestCase.criteria ||
  //         // for backward compatibility
  //         fetchedTestCase.rubric,
  //       fetchedTestCase.criteria,
  //     ),
  //     results: returnByPipelineType(
  //       type,
  //       fetchedResults,
  //       // newer pairwise results contain a ranking attribute,
  //       // if this are old results, discard them
  //       fetchedResults === null ? null : 'ranking' in fetchedResults ? fetchedResults : null,
  //     ),
  //     pipeline: fetchedTestCase.pipeline,
  //     expectedResults: returnByPipelineType(
  //       type,
  //       fetchedTestCase.expectedResults,
  //       // old usecases had 'none' as the expected result
  //       // set those as ''
  //       (fetchedTestCase.expectedResults as TestCaseV0['expectedResults'])?.map((expectedResult) =>
  //         new Array((fetchedTestCase.responses as TestCaseV0['responses']).length)
  //           .fill('')
  //           .map((_, i) => `${i + 1}`)
  //           .includes(expectedResult)
  //           ? expectedResult
  //           : '',
  //       ) || null,
  //     ),
  //   }

  const parseFetchedTestCaseV0 = useCallback(
    (fetchedTestCase: Record<string, any>): TestCaseV0 =>
      ({
        ...fetchedTestCase,
        // criteria was added contextFields and predictionField, so we fill them if they are not provided
        criteria: {
          ...fetchedTestCase.criteria,
          contextFields: fetchedTestCase.criteria.contextFields || fetchedTestCase.contextVariableNames,
          predictionField: fetchedTestCase.criteria.predictionField || fetchedTestCase.responseVariableName,
        },
      } as TestCaseV0),
    [],
  )

  const parseFetchedTestCaseV0ToV1 = useCallback(
    (fetchedTestCase: TestCaseV0): TestCaseV1 => ({
      ...fetchedTestCase,
      // criteria was added contextFields and predictionField, so we fill them if they are not provided
      criteria: {
        ...fetchedTestCase.criteria,
        contextFields: fetchedTestCase.criteria.contextFields || fetchedTestCase.contextVariableNames,
        predictionField: fetchedTestCase.criteria.predictionField || fetchedTestCase.responseVariableName,
      },
    }),
    [],
  )

  const parseFetchedTestCaseV1 = useCallback(
    (fetchedTestCase: Record<string, any>): TestCaseV1 =>
      ({
        ...fetchedTestCase,
      } as TestCaseV1),
    [],
  )

  const testCaseParsingVersionToVersionFunctions: any[] = useMemo(
    () => [parseFetchedTestCaseV0ToV1],
    [parseFetchedTestCaseV0ToV1],
  )

  const testCaseParsingVersionFunctions = useMemo(
    () => [parseFetchedTestCaseV0, parseFetchedTestCaseV1],
    [parseFetchedTestCaseV0, parseFetchedTestCaseV1],
  )

  const CURRENT_FORMAT_VERSION = useMemo(() => 1, [])

  const parseFetchedTestCase = useCallback(
    (fetchedTestCase: FetchedTestCase): TestCase => {
      let toParseObj: Record<string, any>
      try {
        toParseObj = {
          ...JSON.parse(fetchedTestCase.content),
          id: fetchedTestCase.id,
          name: fetchedTestCase.name,
        }
      } catch {
        throw Error("The json file either doesn't have a content field or its value is not a valid json,")
      }

      const version = (toParseObj.contentFormatVersion as number) || 0
      // if (version > CURRENT_FORMAT_VERSION) {
      //   console.log(`Discarding test case ${fetchedTestCase.name} because its newer than the current system version.`)
      //   return null
      // }
      const readFetchedTestCase = testCaseParsingVersionFunctions[version]
      let parsedTestCase = readFetchedTestCase(toParseObj)
      testCaseParsingVersionToVersionFunctions
        .filter((_, i) => i >= version)
        .forEach((parsingFunc, i) => {
          parsedTestCase = parsingFunc(parsedTestCase)
        })
      return parsedTestCase as TestCase
    },
    [testCaseParsingVersionFunctions, testCaseParsingVersionToVersionFunctions],
  )

  return {
    parseFetchedTestCase,
    CURRENT_FORMAT_VERSION,
  }
}
