export interface RubricResult {
  name: string
  option: string
  explanation: string
  positionalBias: boolean
  entropy: number
}

export interface PairwiseResult {
  name: string
  winnerIndex: number
  positionalBias: boolean
  explanation: string
  entropy: number
}

export interface FetchedRubricResult {
  name: string
  option: string
  explanation: string
  p_bias: boolean
  entropy: number
}

export interface FetchedPairwiseResult {
  w_index: number
  explanation: string
  entropy: number
  p_bias: boolean
}

export interface FetchedResults {
  results: (FetchedRubricResult | FetchedPairwiseResult)[]
}

export interface Option {
  option: string
  description: string
}

export type RubricCriteria = {
  name: string
  criteria: string
  options: Option[]
}

export interface PairwiseCriteria {
  name: string
  criteria: string
}

export interface UseCase {
  id: number | null
  name: string
  type: PipelineType
  context: string
  responses: string[]
  criteria: RubricCriteria | PairwiseCriteria
  results: (RubricResult | PairwiseResult)[] | null
  pipeline: string | null
}

export enum PipelineType {
  RUBRIC = 'rubric',
  PAIRWISE = 'pairwise',
}

export interface Pipeline {
  name: string
  type: PipelineType
}
