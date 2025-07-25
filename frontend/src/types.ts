import { DomainEnum, GenerationLengthEnum, PersonaEnum, TaskEnum } from '@constants'

export interface DirectInstanceResultV0 {
  option: string
  positionalBiasOption: string
  certainty: FetchedDirectInstanceResultV0['certainty']
  positionalBias: {
    detected: boolean
    option: string
    explanation: string
  }
  explanation: string
}

export type DirectInstanceResult = DirectInstanceResultV0

export interface PerResponsePairwiseResultV0 {
  contestResults: boolean[]
  positionalBias: boolean[]
  winrate: number
  ranking: number
  comparedTo: string[]
  explanations: FetchedPerResponsePairwiseResultV0['explanations']
}

export type PerResponsePairwiseResult = PerResponsePairwiseResultV0

export type PairwiseInstanceResultV0 = { [key: string]: PerResponsePairwiseResultV0 }

export type PairwiseInstanceResult = PairwiseInstanceResultV0

export interface FetchedDirectInstanceResultV0 {
  option: string
  positional_bias_option: string
  certainty?: number
  explanation: string
  positional_bias: {
    detected: boolean
    option: string
    explanation: string
  }
}

export type FetchedDirectInstanceResultWithId = {
  id: string
  result: FetchedDirectInstanceResultV0
}

export type FetchedDirectInstanceResult = FetchedDirectInstanceResultV0

export type FetchedDirectResultsV0 = FetchedDirectInstanceResultWithId[]
export type FetchedDirectResults = FetchedDirectResultsV0

export type DirectResultsV0 = DirectInstanceResultV0[]
export type DirectResults = DirectResultsV0

interface FetchedPerResponsePairwiseResultV0 {
  contest_results: boolean[]
  winrate: number
  ranking: number
  compared_to: string[]
  explanations: string[]
  certainties?: number[]
  positional_bias: boolean[]
}

export type FetchedPairwiseInstanceResultV0 = {
  [key: string]: FetchedPerResponsePairwiseResultV0
}

export type FetchedPairwiseInstanceResultWithIdV0 = {
  id: string
  result: FetchedPairwiseInstanceResultV0
}

export type FetchedPairwiseResultsV0 = FetchedPairwiseInstanceResultWithIdV0[]

export type FetchedPairwiseResults = FetchedPairwiseResultsV0

export type PairwiseResultsV0 = PairwiseInstanceResultV0[]
export type PairwiseResults = PairwiseResultsV0

export type FetchedResultsV0 = FetchedDirectResultsV0 | FetchedPairwiseResultsV0 | null

export type ResultsV0 = DirectResultsV0 | PairwiseResultsV0 | null

export type Results = ResultsV0

export interface CriteriaOptionV0 {
  name: string
  description: string
}

export type CriteriaOption = CriteriaOptionV0

export type InstanceV0 = {
  id: string
  contextVariables: ContextVariableV0[]
  expectedResult: string
  result: DirectInstanceResult | PairwiseInstanceResult | null
  metadata?: Record<string, any>
}

export type Instance = InstanceV0

export interface DirectInstanceV0 extends InstanceV0 {
  response: string
}

export type DirectInstance = DirectInstanceV0

export interface PairwiseInstanceV0 extends InstanceV0 {
  responses: string[]
}

export type PairwiseInstance = PairwiseInstanceV0

type ContextVariableV0 = { name: string; value: string }

export interface SyntheticGenerationConfig {
  task: TaskEnum | null
  domain: DomainEnum | null
  persona: PersonaEnum | null
  generationLength: GenerationLengthEnum | null
  evaluator: Evaluator | null
  perCriteriaOptionCount: Record<string, number> | null
  borderlineCount: number | null
}

export interface TestCaseV0 {
  id: number | null
  name: string
  type: EvaluationType
  responseVariableName: string
  evaluator: Evaluator | null
  criteria: CriteriaV0 | CriteriaWithOptionsV0
  instances: InstanceV0[]
  syntheticGenerationConfig: SyntheticGenerationConfig
  contextVariableNames: string[]
}

export type TestCase = TestCaseV0

export enum EvaluationType {
  DIRECT = 'direct',
  PAIRWISE = 'pairwise',
}

export enum ModelProviderType {
  WATSONX = 'watsonx',
  OPENAI = 'open-ai',
  OPENAI_LIKE = 'open-ai-like',
  RITS = 'rits',
  AZURE = 'azure',
  LOCAL_HF = 'local_hf',
  TOGETHER_AI = 'together-ai',
  AWS = 'aws',
  VERTEX_AI = 'vertex-ai',
  REPLICATE = 'replicate',
  OLLAMA = 'ollama',
}

export interface Evaluator {
  name: string
  type: EvaluationType
  provider: ModelProviderType
}

export interface FetchedEvaluatorV0 {
  name: string
  providers: ModelProviderType[]
}

export type FetchedEvaluator = FetchedEvaluatorV0

export interface Dataset {
  name: string
  description: string
}

export interface FetchedEvaluatorBenchmark {
  name: string // should be different from model_id, maybe add library version?
  annotation: string
  results: { [key: string]: number } // dict of [metric, result] e.g. {[p_bias, 0.2]}
}

export interface EvaluatorBenchmark {
  name: string // should be different from model_id, maybe add library version?
  annotation: string
  results: { [key: string]: number } // dict of [metric, result] e.g. {[p_bias, 0.2]}
}

export interface FetchedCriteriaBenchmark {
  name: string // must match one of criteriaLibrary (inherits pipeline type from benchmark object pipeline type) e.g. Temperature
  catalog_criteria_name: string
  evaluator_benchmarks: FetchedEvaluatorBenchmark[]
}

export interface CriteriaBenchmark {
  name: string // must match one of criteriaLibrary (inherits pipeline type from benchmark object pipeline type) e.g. Temperature
  catalogCriteriaName: string
  evaluatorBenchmarks: EvaluatorBenchmark[]
}

export interface FetchedBenchmark {
  name: string
  description: string
  catalog_url: string
  readme_url?: string
  type: EvaluationType
  dataset: Dataset
  criteria_benchmarks: FetchedCriteriaBenchmark[]
  tags: string[]
}

export interface Benchmark {
  name: string
  description: string
  catalogUrl: string
  readmeUrl?: string
  type: EvaluationType
  dataset: Dataset
  criteriaBenchmarks: CriteriaBenchmark[]
  tags: string[]
}

export type FetchedCriteriaWithOptionsV0 = {
  name: string
  description: string
  options: CriteriaOptionV0[]
  prediction_field: string
  context_fields: string[]
}

export type FetchedCriteriaWithOptions = FetchedCriteriaWithOptionsV0

export type CriteriaWithOptionsV0 = {
  name: string
  description: string
  options: CriteriaOptionV0[]
  predictionField: string
  contextFields: string[]
}

export type CriteriaWithOptions = CriteriaWithOptionsV0

export interface FetchedCriteriaV0 {
  name: string
  description: string
  prediction_field: string
  context_fields: string[]
}

export type FetchedCriteria = FetchedCriteriaV0

export interface CriteriaV0 {
  name: string
  description: string
  predictionField: string
  contextFields: string[]
}

export type Criteria = CriteriaV0

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
    api_key: string
    project_id: string
    space_id: string
    api_base: string
  }
  'open-ai': {
    api_key: string
  }
  'open-ai-like': {
    api_key: string
    api_base: string
  }
  rits: {
    api_key: string
  }
  azure: {
    api_key: string
    api_base: string
  }
  local_hf: {}
  'together-ai': {
    api_key: string
  }
  aws: {
    api_key: string
  }
  ['vertex-ai']: {
    api_key: string
  }
  replicate: {
    api_key: string
  }
  ollama: {
    api_base: string
  }
}

export type PartialModelProviderCredentials = Partial<ModelProviderCredentials>

export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T

export type DeepPartialModelProviderCredentials = DeepPartial<ModelProviderCredentials>

export type DeepPartialBooleanMap<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartialBooleanMap<T[P]> : boolean
}

export type DeepPartialBooleanModelProviderCredentials = DeepPartialBooleanMap<ModelProviderCredentials>
export interface CaretCoordinates {
  x: number
  y: number
}

export type FetchedTestCase = {
  id: number
  user_id: number
  content: string
  name: string
}

export type AppUser = {
  id: number
  emai: string
  name: string
  createdAt: string
}
