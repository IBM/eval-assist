export interface RubricResult {
  name: string
  option: string
  explanation: string
  positionalBias: boolean
  certainty: number
}

export interface PairwiseResult {
  name: string
  winnerIndex: number
  positionalBias: boolean
  explanation: string
  certainty: number
}

export interface FetchedRubricResult {
  name: string
  option: string
  explanation: string
  p_bias: boolean
  certainty: number
}

export interface FetchedPairwiseResult {
  w_index: number
  explanation: string
  certainty: number
  p_bias: boolean
}

export interface FetchedResults {
  results: (FetchedRubricResult | FetchedPairwiseResult)[]
}

export interface Option {
  option: string
  description: string
}

export interface UseCase {
  id: number | null
  name: string
  type: PipelineType
  context: string
  responses: string[]
  criteria: RubricCriteria | PairwiseCriteria
  results: RubricResult[] | PairwiseResult[] | null
  expectedResults: null | string[]
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

export interface Dataset {
  name: string
  description: string
}

export interface EvaluatorBenchmark {
  evaluator_id: string // should be different from model_id, maybe add library version?
  laaj_version: string
  results: { [key: string]: number } // dict of [metric, result] e.g. {[p_bias, 0.2]}
}

export interface CriteriaBenchmark {
  name: string // must match one of criteriaLibrary (inherits pipeline type from benchmark object pipeline type) e.g. Temperature
  evaluatorBenchmarks: EvaluatorBenchmark[]
}

export interface Benchmark {
  name: string
  description: string
  link?: string
  type: PipelineType // rubric or pairwise
  dataset: Dataset
  criteriaBenchmarks: CriteriaBenchmark[]
  tags: string[]
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

export class Version {
  version: string

  constructor(version: string) {
    this.version = version
  }

  valueOf() {
    const version = this.version.startsWith('v') ? this.version.substring(1) : this.version
    return version
      .split('.')
      .map((versionSection) => {
        return '0'.repeat(2 - versionSection.length) + versionSection
      })
      .join('')
  }
}

export const badgeColorsArray = ['red', 'magenta', 'cyan', 'teal', 'green', 'blue', 'purple'] as const

export type BadgeColor = (typeof badgeColorsArray)[number]
