import {
  Criteria,
  CriteriaWithOptions,
  DirectInstance,
  EvaluationType,
  Instance,
  Option,
  PairwiseInstance,
  PairwiseInstanceResult,
  UseCase,
} from '@types'

export const isInstanceOfOption = (obj: any): obj is Option =>
  typeof obj.name === 'string' && typeof obj.description === 'string'

export const isInstanceOfPairwiseResult = (obj: any): obj is PairwiseInstanceResult =>
  obj !== null &&
  typeof obj.name === 'string' &&
  typeof obj.winnerIndex === 'number' &&
  typeof obj.positionalBias === 'boolean' &&
  typeof obj.explanation === 'string' &&
  typeof obj.certainty === 'number'

export const isInstanceOfCriteriaWithOptions = (obj: any): obj is CriteriaWithOptions =>
  typeof obj.name === 'string' &&
  typeof obj.description === 'string' &&
  obj.options !== undefined &&
  obj.options.every((o: Option) => isInstanceOfOption(o))

export const isInstanceOfCriteria = (obj: any): obj is Criteria =>
  typeof obj.name === 'string' && typeof obj.description === 'string'

export const getEmptyCriteriaWithTwoOptions = (): CriteriaWithOptions => ({
  name: '',
  description: '',
  options: [
    {
      name: '',
      description: '',
    },
    {
      name: '',
      description: '',
    },
  ],
})

export const getEmptyCriteria = (): Criteria => ({
  name: '',
  description: '',
})

export const getEmptyCriteriaByType = (type: EvaluationType): CriteriaWithOptions | Criteria =>
  type === EvaluationType.DIRECT ? getEmptyCriteriaWithTwoOptions() : getEmptyCriteria()

export const getEmptyInstance = (): Instance => ({
  contextVariables: [{ name: 'context', value: '' }],
  expectedResult: '',
  result: null,
})

export const getEmptyPairwiseInstance = (): PairwiseInstance => ({
  ...getEmptyInstance(),
  responses: ['', ''],
})
export const getEmptyDirectInstance = (): DirectInstance => ({ ...getEmptyInstance(), response: '', result: null })

export const getEmptyUseCase = (type: EvaluationType): UseCase => ({
  id: null,
  name: '',
  type,
  instances: returnByPipelineType(type, [getEmptyDirectInstance()], [getEmptyPairwiseInstance()]),
  criteria: getEmptyCriteriaWithTwoOptions(),
  evaluator: null,
  responseVariableName: 'response',
})

export const getEmptyExpectedResults = (count: number) => {
  return new Array(count).fill(null).map((_) => '')
}

export const returnByPipelineType = <T = any, S = any>(
  type: EvaluationType,
  returnIfRubric: T | (() => T),
  returnIfPairwise: S | (() => S),
): T | S => {
  if ([EvaluationType.DIRECT, EvaluationType.OLD_DIRECT, EvaluationType.OLD_RUBRIC].includes(type)) {
    return typeof returnIfRubric === 'function' ? (returnIfRubric as () => T)() : returnIfRubric
  } else if (
    [EvaluationType.PAIRWISE, EvaluationType.OLD_PAIRWISE, EvaluationType.OLD_ALL_VS_ALL_PAIRWISE].includes(type)
  ) {
    return typeof returnIfPairwise === 'function' ? (returnIfPairwise as () => S)() : returnIfPairwise
  } else {
    throw new Error(`In 'returnByPipelineType' an unknown type was received: ${type}`)
  }
}

export const getJSONStringWithSortedKeys = (unsortedObj: any) => {
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

export const toTitleCase = (inputString: string) => {
  if (inputString === 'rag_hallucination_risks') {
    return 'RAG Hallucination Risks'
  }
  return inputString
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .map((word) => (acronyms.includes(word.toLocaleLowerCase()) ? word.toUpperCase() : word))
    .join(' ')
}

const acronyms = ['rag', 'rqa']

export const capitalizeFirstWord = (inputString: string) => {
  return inputString
    .split('_')
    .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .map((word) => (acronyms.includes(word.toLocaleLowerCase()) ? word.toUpperCase() : word))
    .join(' ')
}

export const toSnakeCase = (text: string) => {
  return text.toLowerCase().replace(/ /g, '_')
}

// python's zip-like function
export const zip = (rows: any[][]) => rows[0].map((_, c) => rows.map((row) => row[c]))
