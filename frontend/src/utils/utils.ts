import { pairwiseCriteriaLibrary, rubricCriteriaLibrary } from 'src/libraries/CriteriaLibrary'

import { StoredUseCase } from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'
import {
  Option,
  PairwiseCriteria,
  PairwiseResults,
  PipelineType,
  RubricCriteria,
  UseCase,
  UseCaseV0,
} from '@utils/types'

export const isInstanceOfOption = (obj: any): obj is Option =>
  typeof obj.option === 'string' && typeof obj.description === 'string'

export const isInstanceOfPairwiseResult = (obj: any): obj is PairwiseResults =>
  obj !== null &&
  typeof obj.name === 'string' &&
  typeof obj.winnerIndex === 'number' &&
  typeof obj.positionalBias === 'boolean' &&
  typeof obj.explanation === 'string' &&
  typeof obj.certainty === 'number'

export const isInstanceOfRubricCriteria = (obj: any): obj is RubricCriteria =>
  typeof obj.name === 'string' &&
  typeof obj.criteria === 'string' &&
  obj.options !== undefined &&
  obj.options.every((o: Option) => isInstanceOfOption(o))

export const isInstanceOfPairwiseCriteria = (obj: any): obj is PairwiseCriteria =>
  typeof obj.name === 'string' && typeof obj.criteria === 'string'

// EXAMPLES
// fetched use case is v0 and current is v1
// parseFetchedUseCaseV0 -> parseFetchedUseCaseV0toV1

// fetched use case is v1 and current is v1
// parseFetchedUseCaseV1

// fetched use case is v0 and current is v4
// parseFetchedUseCaseV0 -> parseFetchedUseCaseV0toV1 -> parseFetchedUseCaseV1toV2 -> parseFetchedUseCaseV2toV3 -> parseFetchedUseCaseV3toV4
// fetched use case is v3 and current is v4
// parseFetchedUseCaseV3 -> parseFetchedUseCaseV3toV4

const parseFetchedUseCaseV0 = (fetchedUseCase: Record<string, any>): UseCaseV0 => {
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
}

// this version changes contextVariables from a list of {variable: string, value: string} to Record<string, string>
// const parseFetchedUseCaseV0toV1 = (fetchedUseCase: any) => ({
//   ...fetchedUseCase,
//   contextVariables: fetchedUseCase.contextVariables.reduce(
//     (acc: UseCaseV1['contextVariables'], currentValue: { variable: string; value: string }) => {
//       acc[currentValue.value] = currentValue.variable
//       return acc
//     },
//     {},
//   ),
// })

function returnParam(x: any): any {
  return x
}

const useCaseParsingVersionToVersionFunctions: any[] = [] // [parseFetchedUseCaseV0toV1]
const useCaseParsingVersionFunctions = [parseFetchedUseCaseV0]

export const CURRENT_FORMAT_VERSION = 0
export const parseFetchedUseCase = (fetchedUseCase: StoredUseCase): UseCase => {
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
}

export const getEmptyRubricCriteria = (): RubricCriteria => ({
  name: '',
  criteria: '',
  options: [
    {
      option: '',
      description: '',
    },
    {
      option: '',
      description: '',
    },
  ],
})

export const getEmptyPairwiseCriteria = (): PairwiseCriteria => ({
  name: '',
  criteria: '',
})

export const getEmptyCriteria = (type: PipelineType): RubricCriteria | PairwiseCriteria =>
  type === PipelineType.RUBRIC ? getEmptyRubricCriteria() : getEmptyPairwiseCriteria()

export const getEmptyUseCase = (type: PipelineType): UseCase => ({
  id: null,
  name: '',
  type,
  contextVariables: [{ variable: 'context', value: '' }],
  responseVariableName: 'response',
  responses: type === PipelineType.RUBRIC ? [''] : ['', ''],
  criteria: getEmptyRubricCriteria(),
  results: null,
  pipeline: null,
  expectedResults: null,
})

export const getEmptyExpectedResults = (count: number) => {
  return new Array(count).fill(null).map((_) => '')
}

export const getUseCaseWithCriteria = (criteriaName: string, type: PipelineType): UseCase => ({
  ...getEmptyUseCase(type),
  criteria: getCriteria(criteriaName, type) || getEmptyCriteria(type),
})

export const returnByPipelineType = (type: PipelineType, returnIfRubric: any, returnIfPairwise: any) =>
  type === PipelineType.RUBRIC ? returnIfRubric : returnIfPairwise

export const getUseCaseStringWithSortedKeys = (unsortedObj: UseCase) => {
  const aux = unsortedObj as unknown as { [key: string]: string }
  return JSON.stringify(
    Object.keys(aux)
      .sort()
      .reduce((obj: { [key: string]: string }, key: string) => {
        obj[key] = aux[key]
        return obj
      }, {}),
  )
}
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth',
  })
}

export const scrollToBottom = () => {
  window.scrollTo({
    top: document.body.scrollHeight,
    left: 0,
    behavior: 'smooth',
  })
}

export const getQueryParamsFromUseCase = (useCase: UseCase) =>
  useCase.id !== null
    ? [{ key: 'id', value: `${useCase.id}` }]
    : useCase.name !== ''
    ? [
        { key: 'libraryTestCase', value: useCase.name },
        { key: 'type', value: useCase.type },
      ]
    : [{ key: 'type', value: useCase.type }]

export const stringifyQueryParams = (
  queryParams: {
    key: string
    value: string
  }[],
) => {
  return `?${queryParams
    .map((queryParam) => encodeURIComponent(queryParam.key) + '=' + encodeURIComponent(queryParam.value))
    .join('&')}`
}

export const getCriteria = (name: string, type: PipelineType): RubricCriteria | PairwiseCriteria | null => {
  const criteria = returnByPipelineType(type, rubricCriteriaLibrary, pairwiseCriteriaLibrary).find(
    (c: RubricCriteria | PairwiseCriteria) => c.name === name,
  ) as RubricCriteria | PairwiseCriteria | undefined
  return criteria ?? null
}

export const fromLexicalToString = () => {}

export const fromStringToLexicalFormat = () => {}

/**
 * Returns the suffix of a number in its ordinal form
 **/
export const getOrdinalSuffix = (x: number): string => {
  // suffix pattern repeats every 100 numbers
  x %= 100
  let prefix = 'th'
  if (x <= 3 || x >= 21) {
    switch (x % 10) {
      case 1:
        prefix = 'st'
        break
      case 2:
        prefix = 'nd'
        break
      case 3:
        prefix = 'rd'
        break
      default: {
      }
    }
  }
  return prefix
}

export const toPercentage = (value: number) => (value * 100).toFixed(0) + '%'
