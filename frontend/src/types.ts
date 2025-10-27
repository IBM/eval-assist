import { DomainEnum, GenerationLengthEnum, PersonaEnum, TaskEnum } from '@constants'

export interface DirectInstanceResultV0 {
  option: string
  positionalBiasOption: string
  certainty: FetchedDirectInstanceResultV0['certainty']
  explanation: string
  metadata?: FetchedDirectInstanceResultV0['metadata']
}

export interface DirectInstanceResultV1 extends DirectInstanceResultV0 {
  feedback?: string
  score?: number
}

export interface DirectInstanceResultV2 extends Omit<DirectInstanceResultV1, 'option' | 'certainty'> {
  selectedOption: string
  positionalBias: {
    detected: boolean
    result: DirectInstanceResultV2
  } | null
}

export type DirectInstanceResult = DirectInstanceResultV2

export interface PerResponsePairwiseResultV0 {
  contestResults: (boolean | string)[]
  positionalBias: boolean[]
  winrate: number
  ranking: number
  comparedTo: string[]
  explanations: FetchedPerResponsePairwiseResultV0['explanations']
}

export type PerResponsePairwiseResult = PerResponsePairwiseResultV0

export type PairwiseInstanceResultV0 = { [key: string]: PerResponsePairwiseResultV0 }

export interface PairwiseInstanceResultV1 {
  perSystemResults: PerResponsePairwiseResultV0[] | null
  selectedOption: number | string
  explanation: string
  metadata?: { [key: string]: string }
  positionalBias: {
    detected: boolean
    result: PairwiseInstanceResultV1
  } | null
}

export type PairwiseInstanceResult = PairwiseInstanceResultV1

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
  metadata?: { [key: string]: string }
}

export interface FetchedDirectInstanceResultV1 extends FetchedDirectInstanceResultV0 {
  feedback?: string
  score?: number
}

export interface FetchedDirectInstanceResultV2
  extends Omit<FetchedDirectInstanceResultV1, 'option' | 'positional_bias'> {
  selected_option: string
  explanation: string
  positional_bias?: {
    detected: boolean
    result: FetchedDirectInstanceResultV2
  }
}

export type FetchedDirectInstanceResultWithIdV0 = {
  id: string
  result: FetchedDirectInstanceResultV1
}

export type FetchedDirectInstanceResultWithIdV1 = {
  id: string
  result: FetchedDirectInstanceResultV2
}

export type FetchedDirectInstanceResultWithId = FetchedDirectInstanceResultWithIdV1

export type FetchedDirectInstanceResult = FetchedDirectInstanceResultV2

export type FetchedDirectResultsV0 = FetchedDirectInstanceResultWithIdV0[]
export type FetchedDirectResultsV1 = FetchedDirectInstanceResultWithIdV1[]
export type FetchedDirectResults = FetchedDirectResultsV1

export type DirectResultsV0 = DirectInstanceResultV0[]
export type DirectResultsV1 = DirectInstanceResultV1[]
export type DirectResultsV2 = DirectInstanceResultV2[]
export type DirectResults = DirectResultsV2

interface FetchedPerResponsePairwiseResultV0 {
  contest_results: boolean[]
  winrate: number
  ranking: number
  compared_to: string[]
  explanations: string[]
  certainties?: number[]
  positional_bias: boolean[]
}

interface FetchedPerResponsePairwiseResultV1 extends Omit<FetchedPerResponsePairwiseResultV0, 'certainties'> {
  metadata?: FetchedDirectInstanceResultV0['metadata']
}

export type FetchedPairwiseInstanceResultV0 = {
  [key: string]: FetchedPerResponsePairwiseResultV0
}

export interface FetchedPairwiseInstanceResultV1 {
  per_system_results?: FetchedPerResponsePairwiseResultV1[]
  selected_option: number | string
  explanation: string
  positional_bias?: {
    detected: boolean
    result: FetchedPairwiseInstanceResultV1
  }
  metadata?: { [key: string]: string }
}

export type FetchedPairwiseInstanceResult = FetchedPairwiseInstanceResultV1

export type FetchedPairwiseInstanceResultWithIdV0 = {
  id: string
  result: FetchedPairwiseInstanceResultV0
}

export type FetchedPairwiseInstanceResultWithIdV1 = {
  id: string
  result: FetchedPairwiseInstanceResultV1
}

export type FetchedPairwiseInstanceResultWithId = FetchedPairwiseInstanceResultWithIdV1

export type FetchedPairwiseResultsV0 = FetchedPairwiseInstanceResultWithIdV0[]
export type FetchedPairwiseResultsV1 = FetchedPairwiseInstanceResultWithIdV1[]

export type FetchedPairwiseResults = FetchedPairwiseResultsV1

export type PairwiseResultsV0 = PairwiseInstanceResultV0[]
export type PairwiseResultsV1 = PairwiseInstanceResultV1[]
export type PairwiseResults = PairwiseResultsV1

export type FetchedResultsV0 = FetchedDirectResultsV1 | FetchedPairwiseResultsV1 | null

export type ResultsV0 = DirectResultsV0 | PairwiseResultsV0 | null
export type ResultsV1 = DirectResultsV1 | PairwiseResultsV1 | null
export type ResultsV2 = DirectResultsV2 | PairwiseResultsV1 | null

export type Results = ResultsV2

export interface CriteriaOptionV0 {
  name: string
  description: string
}

export type CriteriaOption = CriteriaOptionV0

export type InstanceV0 = {
  id: string
  contextVariables: ContextVariableV0[]
  expectedResult: string | number
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

export type ContextVariable = ContextVariableV0

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
  contextVariableNames: string[]
  evaluator: Evaluator | null
  criteria: CriteriaV1 | CriteriaWithOptionsV1
  instances: InstanceV0[]
  syntheticGenerationConfig: SyntheticGenerationConfig
}

export interface TestCaseV1 extends Omit<TestCaseV0, 'responseVariableName' | 'contextVariableNames'> {}

export type TestCase = TestCaseV1

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
  LOCAL_HF = 'hf-local',
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

export type FetchedJudgeResult = {
  judge: string
  model: string
  results: { [key: string]: number }
}

export type FetchedGroupByValueResult = {
  dataset_len: string
  group_by_value: string
  judge_results: {
    [key: string]: FetchedJudgeResult
  }
}

export type FetchedGroupByValueResults = {
  [key: string]: FetchedGroupByValueResult
}

export interface FetchedBenchmark {
  display_name: string
  description: string
  catalog_url: string
  url?: string
  type: EvaluationType
  dataset_name: string
  tags: string[]
  group_by_fields: {
    [key: string]: FetchedGroupByValueResults
  }
}

export type JudgeResult = {
  judge: string
  model: string
  results: { [key: string]: number }
}

export type GroupByValueResult = {
  datasetLen: string
  groupByValue: string
  judgeResults: {
    [key: string]: JudgeResult
  }
}

export type GroupByValueResults = {
  [key: string]: GroupByValueResult
}

export interface Benchmark {
  name: string
  description: string
  catalogUrl: string
  url?: string
  type: EvaluationType
  dataset: string
  tags: string[]
  groupByFieldsToValues: {
    [key: string]: GroupByValueResults
  }
}

export interface FetchedCriteriaWithOptionsV0 extends FetchedCriteriaV0 {
  name: string
  description: string
  options: CriteriaOptionV0[]
}

export interface FetchedCriteriaWithOptionsV1 extends FetchedCriteriaWithOptionsV0 {
  to_evaluate_field: string
  context_fields: string[]
}

export type FetchedCriteriaWithOptions = FetchedCriteriaWithOptionsV0

export interface CriteriaWithOptionsV0 extends CriteriaV0 {
  name: string
  description: string
  options: CriteriaOptionV0[]
}

export interface CriteriaWithOptionsV1 extends CriteriaV1 {
  name: string
  description: string
  options: CriteriaOptionV0[]
}

export type CriteriaWithOptions = CriteriaWithOptionsV1

export interface FetchedCriteriaV0 {
  name: string
  description: string
  to_evaluate_field: string
  context_fields: string[]
}

export interface FetchedCriteriaV1 extends FetchedCriteriaV0 {
  predictionField: string
  contextFields: string[]
}

export type FetchedCriteria = FetchedCriteriaV1

export interface CriteriaV0 {
  name: string
  description: string
}

export interface CriteriaV1 extends CriteriaV0 {
  predictionField: string
  contextFields: string[]
}

export type Criteria = CriteriaV1

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

export const badgeColorsArray = ['blue', 'purple', 'red', 'teal', 'green', 'magenta', 'cyan'] as const

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
  'hf-local': {}
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
