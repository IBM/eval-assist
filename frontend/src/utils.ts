import Papa from 'papaparse'
import { v4 as uuidv4 } from 'uuid'

import {
  CaretCoordinates,
  Criteria,
  CriteriaOption,
  CriteriaWithOptions,
  DirectInstance,
  EvaluationType,
  Instance,
  PairwiseInstance,
  PairwiseInstanceResult,
  TestCase,
} from '@types'

export const isInstanceOfOption = (obj: any): obj is CriteriaOption =>
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
  typeof obj.predictionField === 'string' &&
  typeof obj.contextFields === 'object' &&
  obj.options !== undefined &&
  obj.options.every((o: CriteriaOption) => isInstanceOfOption(o))

export const isInstanceOfCriteria = (obj: any): obj is Criteria =>
  typeof obj.name === 'string' &&
  typeof obj.description === 'string' &&
  typeof obj.predictionField === 'string' &&
  typeof obj.contextFields === 'string'

export const getEmptyCriteria = (): Criteria => ({
  name: '',
  description: '',
  predictionField: 'Response',
  contextFields: ['Context'],
})

export const getEmptyCriteriaWithTwoOptions = (): CriteriaWithOptions => ({
  ...getEmptyCriteria(),
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

export const getEmptyCriteriaByType = (type: EvaluationType): CriteriaWithOptions | Criteria =>
  type === EvaluationType.DIRECT ? getEmptyCriteriaWithTwoOptions() : getEmptyCriteria()

export const getEmptyInstance = (contextVariableNames: string[]): Instance => {
  return {
    contextVariables: contextVariableNames.map((cvn) => ({ name: cvn, value: '' })),
    expectedResult: '',
    result: null,
    id: generateId(),
  }
}

export const getEmptyPairwiseInstance = (contextVariableNames: string[], systemCount: number): PairwiseInstance => {
  return {
    ...getEmptyInstance(contextVariableNames),
    responses: new Array(systemCount).fill(''),
  }
}
export const getEmptyDirectInstance = (contextVariableNames: string[]): DirectInstance => ({
  ...getEmptyInstance(contextVariableNames),
  response: '',
})

export const getEmptyTestCase = (type: EvaluationType, criteria?: Criteria): TestCase => {
  const c = criteria ?? returnByPipelineType(type, getEmptyCriteriaWithTwoOptions, getEmptyCriteria)
  return {
    id: null,
    name: '',
    type,
    instances: returnByPipelineType(
      type,
      [getEmptyDirectInstance(c.contextFields)],
      [getEmptyPairwiseInstance(c.contextFields, 2)],
    ),
    criteria: criteria ?? returnByPipelineType(type, getEmptyCriteriaWithTwoOptions, getEmptyCriteria),
    evaluator: null,
    syntheticGenerationConfig: {
      task: null,
      domain: null,
      persona: null,
      generationLength: null,
      evaluator: null,
      perCriteriaOptionCount: null,
      borderlineCount: null,
    },
  }
}

export const getEmptyExpectedResults = (count: number) => {
  return new Array(count).fill(null).map((_) => '')
}

export const returnByPipelineType = <T = any, S = any>(
  type: EvaluationType,
  returnIfDirect: T | (() => T),
  returnIfPairwise: S | (() => S),
): T | S => {
  if (EvaluationType.DIRECT === type) {
    return typeof returnIfDirect === 'function' ? (returnIfDirect as () => T)() : returnIfDirect
  } else if (EvaluationType.PAIRWISE == type) {
    return typeof returnIfPairwise === 'function' ? (returnIfPairwise as () => S)() : returnIfPairwise
  } else {
    throw new Error(`In 'returnByPipelineType' an unknown type was received: ${type}`)
  }
}

export const getJSONStringWithSortedKeys = (unsortedObj: any) => {
  const aux = unsortedObj as unknown as { [key: string]: string }
  return unsortedObj !== null
    ? JSON.stringify(
        Object.keys(aux)
          .sort()
          .reduce((obj: { [key: string]: string }, key: string) => {
            obj[key] = aux[key]
            return obj
          }, {}),
      )
    : ''
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

export const splitDotsAndCapitalizeFirstWord = (inputString: string) =>
  inputString.split('.').map(capitalizeFirstWord).join(' - ')

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

export const getCaretPosition = (
  input: HTMLInputElement | HTMLTextAreaElement,
  selection: 'selectionStart' | 'selectionEnd' = 'selectionEnd',
): CaretCoordinates => {
  const { scrollLeft, scrollTop } = input
  const selectionPoint = input[selection] ?? input.selectionStart ?? 0
  const { height, width, left, top } = input.getBoundingClientRect()

  const div = document.createElement('div')
  const copyStyle = getComputedStyle(input)
  for (const prop of copyStyle) {
    div.style.setProperty(prop, copyStyle.getPropertyValue(prop))
  }

  const swap = '.'
  const inputValue = input.tagName === 'INPUT' ? input.value.replace(/ /g, swap) : input.value

  const textContent = inputValue.substring(0, selectionPoint)
  div.textContent = textContent

  if (input.tagName === 'TEXTAREA') div.style.height = 'auto'
  if (input.tagName === 'INPUT') div.style.width = 'auto'

  div.style.position = 'absolute'
  div.style.whiteSpace = 'pre-wrap'
  div.style.visibility = 'hidden'

  const span = document.createElement('span')
  span.textContent = inputValue.substring(selectionPoint) || '.'
  div.appendChild(span)
  document.body.appendChild(div)

  const { offsetLeft: spanX, offsetTop: spanY } = span
  document.body.removeChild(div)

  let x = spanX
  let y = spanY

  const lineHeight = parseInt(copyStyle.lineHeight || '0', 10)
  const paddingRight = parseInt(copyStyle.paddingRight || '0', 10)

  x = x - scrollLeft
  y = y - scrollTop

  return { x, y }
}

export const getSelectionPosition = (input: HTMLInputElement | HTMLTextAreaElement): CaretCoordinates => {
  const { y: startY, x: startX } = getCaretPosition(input, 'selectionStart')
  const { x: endX } = getCaretPosition(input, 'selectionEnd')

  const x = startX + (endX - startX) / 2
  const y = startY

  return { x, y }
}

export const generateId = () =>
  typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID ? window.crypto.randomUUID() : uuidv4()

export const parseCriteriaForBackend = (criteria: Criteria) => {
  const res = {
    name: criteria.name,
    description: criteria.description,
    prediction_field: criteria.predictionField,
    context_fields: criteria.contextFields,
  }
  if (isInstanceOfCriteriaWithOptions(criteria)) {
    const withOptions = {
      ...res,
      options: criteria.options,
    }
    return withOptions
  }
  return res
}

export const parseInstanceForBackend = (instance: Instance, type: EvaluationType) => {
  return {
    context_variables: instance.contextVariables.reduce(
      (acc, item, index) => ({ ...acc, [item.name]: item.value }),
      {},
    ),
    [returnByPipelineType(type, 'response', 'responses')]: returnByPipelineType(
      type,
      () => (instance as DirectInstance).response,
      () => (instance as PairwiseInstance).responses,
    ),
    id: instance.id,
    expected_result: instance.expectedResult,
    is_synthetic: instance.metadata?.synthetic_generation ? true : false,
  }
}

export const readJsonFile = <T = any>(file: Blob): Promise<T> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        resolve(JSON.parse(text))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

export const readCsvFile = <T = any>(file: Blob): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parsed = Papa.parse<T>(text, { header: true, skipEmptyLines: true, delimiter: ',' })
        if (parsed.errors.length) {
          reject(parsed.errors)
        } else {
          resolve(parsed.data)
        }
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}
