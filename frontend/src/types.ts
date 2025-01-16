export interface DirectAssessmentResultV0 {
  name: string
  option: string
  explanation: string
  positionalBias: boolean
  certainty: number
}

export interface DirectAssessmentResultV1 extends Omit<DirectAssessmentResultV0, 'certainty' | 'name' | 'explanation'> {
  positionalBiasOption: string
  certainty: FetchedDirectAssessmentResultV1['certainty']
  summary: string
}

export type DirectAssessmentResult = DirectAssessmentResultV1

export interface PerResponsePairwiseResultV0 {
  contestResults: boolean[]
  comparedToIndexes: number[]
  explanations: { [key: string]: string }
  positionalBias: boolean[]
  certainty: number[]
  winrate: number
  ranking: number
}

export interface PerResponsePairwiseResultV1
  extends Omit<PerResponsePairwiseResultV0, 'comparedToIndexes' | 'explanations' | 'certainty'> {
  comparedTo: string[]
  summaries: FetchedPerResponsePairwiseResultV1['summaries']
  certainties: FetchedPerResponsePairwiseResultV1['certainties']
}

export type PerResponsePairwiseResult = PerResponsePairwiseResultV1

export interface PairwiseComparisonResultsV0 {
  perResponseResults: {
    [key: string]: PerResponsePairwiseResultV0
  }
  ranking: number[]
}

export type PairwiseComparisonResultsV1 = { [key: string]: PerResponsePairwiseResultV1 }

export type PairwiseComparisonResults = PairwiseComparisonResultsV1

export interface FetchedDirectAssessmentResultV0 {
  name: string
  option: string
  explanation: string
  p_bias: boolean
  certainty: number
}

export interface FetchedDirectAssessmentResultV1
  extends Omit<FetchedDirectAssessmentResultV0, 'p_bias' | 'explanation' | 'name' | 'certainty'> {
  summary: string
  positional_bias: boolean
  positional_bias_option: string
  certainty?: number
}

export type FetchedDirectAssessmentResultsV0 = FetchedDirectAssessmentResultV0[]
export type FetchedDirectAssessmentResultsV1 = FetchedDirectAssessmentResultV1[]
export type FetchedDirectAssessmentResults = FetchedDirectAssessmentResultsV1

export type DirectAssessmentResultsV0 = DirectAssessmentResultV0[]
export type DirectAssessmentResultsV1 = DirectAssessmentResultV1[]
export type DirectAssessmentResults = DirectAssessmentResultsV1

interface FetchedPerResponsePairwiseResultV0 {
  contest_results: boolean[]
  compared_to_indexes: number[]
  explanations: { [key: string]: string }
  p_bias?: boolean[]
  certainty: number[]
  winrate: number
  ranking: number
}

interface FetchedPerResponsePairwiseResultV1
  extends Omit<FetchedPerResponsePairwiseResultV0, 'compared_to_indexes' | 'explanations' | 'p_bias' | 'certainty'> {
  compared_to: string[]
  summaries: string[]
  certainties?: number[]
  positional_bias: boolean[]
}

export interface FetchedPairwiseComparisonResultsV0 {
  perResponseResults: {
    [key: string]: FetchedPerResponsePairwiseResultV0
  }
  ranking: number[]
}

export type FetchedPairwiseComparisonResultsV1 = {
  [key: string]: FetchedPerResponsePairwiseResultV1
}

export type FetchedPairwiseComparisonResults = FetchedPairwiseComparisonResultsV1

export type FetchedResultsV0 = FetchedDirectAssessmentResultsV0 | FetchedPairwiseComparisonResultsV0 | null

export type FetchedResultsV1 = FetchedDirectAssessmentResultsV1 | FetchedPairwiseComparisonResultsV1 | null

export type ResultsV0 = DirectAssessmentResultsV0 | PairwiseComparisonResultsV0 | null
export type ResultsV1 = DirectAssessmentResultsV1 | PairwiseComparisonResultsV1 | null

export interface OptionV0 {
  option: string
  description: string
}

export interface OptionV1 {
  name: string
  description: string
}

export type Option = OptionV1

export interface UseCaseV0 {
  id: number | null
  name: string
  type: EvaluationType
  contextVariables: { variable: string; value: string }[]
  responseVariableName: string
  responses: string[]
  criteria: DirectAssessmentCriteriaV0 | PairwiseComparisonCriteriaV0
  results: ResultsV0
  expectedResults: null | string[]
  pipeline: string | null
}

export interface UseCaseV1 extends Omit<UseCaseV0, 'pipeline'> {
  pipeline: Evaluator | null
}

export interface UseCaseV2 extends Omit<UseCaseV1, 'criteria' | 'pipeline' | 'results'> {
  evaluator: Evaluator | null
  criteria: DirectAssessmentCriteriaV1 | PairwiseComparisonCriteriaV1
  results: ResultsV1
}

export type UseCase = UseCaseV2

export enum EvaluationType {
  DIRECT = 'direct',
  OLD_DIRECT = 'direct_assessment',
  OLD_RUBRIC = 'rubric',
  PAIRWISE = 'pairwise',
  OLD_PAIRWISE = 'pairwise',
  OLD_ALL_VS_ALL_PAIRWISE = 'all_vs_all_pairwise',
}

export enum ModelProviderType {
  WATSONX = 'watsonx',
  OPENAI = 'openai',
  RITS = 'rits',
  AZURE_OPENAI = 'azure_openai',
}

export interface Evaluator {
  name: string
  type: EvaluationType
  provider: ModelProviderType
}

export interface FetchedEvaluatorV0 {
  name: string
  model_id: string
  type: EvaluationType
  version: string
  providers: ModelProviderType[]
}

export interface FetchedEvaluatorV1 extends Omit<FetchedEvaluatorV0, 'model_id' | 'version' | 'type'> {
  name: string
  providers: ModelProviderType[]
}

export type FetchedEvaluator = FetchedEvaluatorV1

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
  type: EvaluationType // rubric or pairwise
  dataset: Dataset
  criteriaBenchmarks: CriteriaBenchmark[]
  tags: string[]
}

export type DirectAssessmentCriteriaV0 = {
  name: string
  criteria: string
  options: OptionV0[]
}

export interface DirectAssessmentCriteriaV1 extends Omit<DirectAssessmentCriteriaV0, 'criteria' | 'options'> {
  description: string
  options: OptionV1[]
}

export type DirectAssessmentCriteria = DirectAssessmentCriteriaV1

export interface PairwiseComparisonCriteriaV0 {
  name: string
  criteria: string
}

export interface PairwiseComparisonCriteriaV1 extends Omit<PairwiseComparisonCriteriaV0, 'criteria'> {
  description: string
}

export type PairwiseComparisonCriteria = PairwiseComparisonCriteriaV1

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
  watsonx: {
    apikey: string
    project_id: string
    url: string
  }
  openai: {
    api_key: string
  }
  rits: {
    api_key: string
  }
  azure_openai: {
    api_key: string
  }
}
