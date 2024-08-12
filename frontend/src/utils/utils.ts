import { pairwiseCriteriaLibrary, rubricCriteriaLibrary } from 'src/libraries/CriteriaLibrary'

import { StoredUseCase } from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'
import { Option, PairwiseCriteria, PairwiseResults, PipelineType, RubricCriteria, UseCase } from '@utils/types'

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

export const parseFetchedUseCase = (fetchedUseCase: StoredUseCase): UseCase => {
  const type = ((fetchedUseCase.content as JsonObject)['type'] as PipelineType) ?? PipelineType.RUBRIC
  const fetchedResults = (fetchedUseCase.content as JsonObject)['results'] as UseCase['results']
  return {
    id: fetchedUseCase.id,
    name: fetchedUseCase.name,
    type: type,
    contextVariables: ((fetchedUseCase.content as JsonObject)['contextVariables'] as UseCase['contextVariables']) || [
      { variable: 'context', value: (fetchedUseCase.content as JsonObject)['context'] as string },
    ],
    responseVariableName:
      ((fetchedUseCase.content as JsonObject)['responseVariableName'] as UseCase['responseVariableName']) || '',
    responses: (fetchedUseCase.content as JsonObject)['responses'] as UseCase['responses'],
    criteria: returnByPipelineType(
      type,
      (fetchedUseCase.content as JsonObject)['criteria'] as unknown as RubricCriteria,
      ((fetchedUseCase.content as JsonObject)['criteria'] as unknown as PairwiseCriteria) ||
        // for backward compatibility
        ((fetchedUseCase.content as JsonObject)['rubric'] as unknown as RubricCriteria),
    ),
    results: returnByPipelineType(
      type,
      fetchedResults,
      fetchedResults === null ? null : 'ranking' in fetchedResults ? fetchedResults : null,
    ),
    pipeline: (fetchedUseCase.content as JsonObject)['pipeline'] as UseCase['pipeline'],
    expectedResults: (fetchedUseCase.content as JsonObject)['expectedResults'] as UseCase['expectedResults'],
  }
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
