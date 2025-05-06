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
  summaries: FetchedPerResponsePairwiseResultV1['summaries']
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
  compared_to_indexes: number[]
  explanations: { [key: string]: string }
  p_bias?: boolean[]
  certainty: number[]
  winrate: number
  ranking: number
}

export interface FetchedPairwiseInstanceResultV0 {
  perResponseResults: {
    [key: string]: FetchedPerResponsePairwiseResultV0
  }
  ranking: number[]
}
interface FetchedPerResponsePairwiseResultV1
  extends Omit<FetchedPerResponsePairwiseResultV0, 'compared_to_indexes' | 'explanations' | 'p_bias' | 'certainty'> {
  compared_to: string[]
  summaries: string[]
  certainties?: number[]
  positional_bias: boolean[]
}

type FetchedPairwiseInstanceResultV1 = { id: string; result: Record<string, FetchedPerResponsePairwiseResultV1> }

export type FetchedPairwiseInstanceResult = FetchedPairwiseInstanceResultV1

export type FetchedPairwiseResultsV0 = FetchedPairwiseInstanceResultV0[]
export type FetchedPairwiseResultsV1 = FetchedPairwiseInstanceResultV1[]
export type FetchedPairwiseResults = FetchedPairwiseResultsV1

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
  RITS = 'rits',
  AZURE_OPENAI = 'azure',
  LOCAL_HF = 'local_hf',
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

export type CriteriaWithOptionsV0 = {
  name: string
  description: string
  options: CriteriaOptionV0[]
}

export type CriteriaWithOptions = CriteriaWithOptionsV0

export interface CriteriaV0 {
  name: string
  description: string
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
    api_base: string
  }
  'open-ai': {
    api_key: string
  }
  rits: {
    api_key: string
  }
  azure: {
    api_key: string
  }
  local_hf: {}
}

export type PartialModelProviderCredentials = Partial<Pick<ModelProviderCredentials, keyof ModelProviderCredentials>>

export interface CaretCoordinates {
  x: number
  y: number
}
