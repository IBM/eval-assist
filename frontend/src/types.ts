export interface RubricResult {
  name: string
  option: string
  explanation: string
  positionalBias: boolean
  certainty: number
}

export interface PerResponsePairwiseResult {
  contestResults: boolean[]
  comparedToIndexes: number[]
  explanations: { [key: string]: string }
  positionalBias: boolean[]
  certainty: number[]
  winrate: number
  ranking: number
}

export interface PairwiseResults {
  perResponseResults: {
    [key: string]: PerResponsePairwiseResult
  }
  ranking: number[]
}

export interface FetchedRubricResult {
  name: string
  option: string
  explanation: string
  p_bias: boolean
  certainty: number
}

export interface FetchedPairwiseResults {
  per_response_results: {
    [key: string]: {
      contest_results: boolean[]
      compared_to_indexes: number[]
      explanations: { [key: string]: string }
      p_bias?: boolean[]
      certainty: number[]
      winrate: number
      ranking: number
    }
  }
  ranking: number[]
}

export interface FetchedResults {
  results: FetchedRubricResult[] | FetchedPairwiseResults
}

export interface Option {
  option: string
  description: string
}

export interface UseCaseV0 {
  id: number | null
  name: string
  type: PipelineType
  contextVariables: { variable: string; value: string }[]
  responseVariableName: string
  responses: string[]
  criteria: RubricCriteria | PairwiseCriteria
  results: RubricResult[] | PairwiseResults | null
  expectedResults: null | string[]
  pipeline: string | null
}

// export interface UseCaseV1 extends Omit<UseCaseV0, 'contextVariables'> {
//   contextVariables: Record<string, string>
// }

export interface UseCaseV1 extends Omit<UseCaseV0, 'pipeline'> {
  pipeline: Pipeline | null
}

export type UseCase = UseCaseV1

export enum PipelineType {
  RUBRIC = 'rubric',
  // PAIRWISE = 'pairwise',
  PAIRWISE = 'all_vs_all_pairwise',
  OLD_PAIRWISE = 'pairwise',
}

export enum ModelProviderType {
  WATSONX = 'watsonx',
  BAM = 'bam',
  OPENAI = 'openai',
  LOCAL = 'local',
}

export interface Pipeline {
  model_id: string
  name: string
  type: PipelineType
  provider: ModelProviderType
  version: string
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

export type ModelProviderCredentials = {
  bam: {
    api_key: string
  }
  watsonx: {
    api_key: string
    project_id: string
  }
  openai: {
    api_key: string
  }
}
