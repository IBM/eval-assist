export interface Option {
  option: string
  description: string
}

export type Rubric = {
  title: string
  criteria: string
  options: Option[]
}

export interface Result {
  name: string
  option: string
  explanation: string
  positionalBias: boolean
}

export interface FetchedResult {
  name: string
  option: string
  explanation: string
  p_bias: boolean
}

export interface FetchedResults {
  results: FetchedResult[]
}

export interface UseCase {
  id: number | null
  name: string
  context: string
  responses: string[]
  rubric: Rubric
  results: Result[] | null
}
