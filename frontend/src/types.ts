export interface DirectInstanceResultV0 {
  name: string
  option: string
  explanation: string
  positionalBias: boolean
  certainty: number
}

export interface DirectInstanceResultV1 extends Omit<DirectInstanceResultV0, 'certainty' | 'name' | 'explanation'> {
  positionalBiasOption: string
  certainty: FetchedDirectInstanceResultV1['certainty']
  summary: string
}

export interface DirectInstanceResultV2 extends Omit<DirectInstanceResultV1, 'positionalBias' | 'summary'> {
  positionalBias: {
    detected: boolean
    option: string
    explanation: string
  }
  explanation: string
}

export type DirectInstanceResult = DirectInstanceResultV2

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
}

export type PerResponsePairwiseResult = PerResponsePairwiseResultV1

export interface PairwiseInstanceResultV0 {
  perResponseResults: {
    [key: string]: PerResponsePairwiseResultV0
  }
  ranking: number[]
}

export type PairwiseInstanceResultV1 = { [key: string]: PerResponsePairwiseResultV1 }

export type PairwiseInstanceResult = PairwiseInstanceResultV1

export interface FetchedDirectInstanceResultV0 {
  name: string
  option: string
  explanation: string
  p_bias: boolean
  certainty: number
}

export interface FetchedDirectInstanceResultV1
  extends Omit<FetchedDirectInstanceResultV0, 'p_bias' | 'explanation' | 'name' | 'certainty'> {
  summary: string
  positional_bias: boolean
  positional_bias_option: string
  certainty?: number
}

export interface FetchedDirectInstanceResultV2
  extends Omit<FetchedDirectInstanceResultV1, 'positional_bias' | 'summary'> {
  explanation: string
  positional_bias: {
    detected: boolean
    option: string
    explanation: string
  }
  certainty?: number
}

export type FetchedDirectInstanceResult = FetchedDirectInstanceResultV2

export type FetchedDirectResultsV0 = FetchedDirectInstanceResultV0[]
export type FetchedDirectResultsV1 = FetchedDirectInstanceResultV1[]
export type FetchedDirectResultsV2 = FetchedDirectInstanceResultV2[]
export type FetchedDirectResults = FetchedDirectResultsV2

export type DirectResultsV0 = DirectInstanceResultV0[]
export type DirectResultsV1 = DirectInstanceResultV1[]
export type DirectResults = DirectResultsV1

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

export interface FetchedPairwiseInstanceResultV0 {
  perResponseResults: {
    [key: string]: FetchedPerResponsePairwiseResultV0
  }
  ranking: number[]
}

export type FetchedPairwiseInstanceResultV1 = {
  [key: string]: FetchedPerResponsePairwiseResultV1
}

export type FetchedPairwiseInstanceResult = FetchedPairwiseInstanceResultV1

export type FetchedPairwiseResultsV0 = FetchedPairwiseInstanceResultV0[]
export type FetchedPairwiseResultsV1 = FetchedPairwiseInstanceResultV1[]
export type FetchedPairwiseResults = FetchedPairwiseResultsV1

export type PairwiseResultsV0 = PairwiseInstanceResultV0
export type PairwiseResultsV1 = PairwiseInstanceResultV1
export type PairwiseResultsV2 = PairwiseInstanceResultV1[]
export type PairwiseResults = PairwiseResultsV1

export type FetchedResultsV0 = FetchedDirectResultsV0 | FetchedPairwiseResultsV0 | null

export type FetchedResultsV1 = FetchedDirectResultsV1 | FetchedPairwiseInstanceResultV1 | null

export type ResultsV0 = DirectResultsV0 | PairwiseResultsV0 | null
export type ResultsV1 = DirectResultsV1 | PairwiseResultsV1 | null
export type ResultsV2 = DirectResultsV1 | PairwiseResultsV2 | null

export type Results = ResultsV2

export interface OptionV0 {
  option: string
  description: string
}

export interface OptionV1 {
  name: string
  description: string
}

export type Option = OptionV1

export type Instance = {
  contextVariables: ContextVariableV1[]
  expectedResult: string
  result: DirectInstanceResult | PairwiseInstanceResult | null
  metadata?: Record<string, any>
}

export interface DirectInstance extends Instance {
  response: string
}

export interface PairwiseInstance extends Instance {
  responses: UseCaseV2['responses']
}

type ContextVariableV0 = { variable: string; value: string }
type ContextVariableV1 = { name: string; value: string }

export interface UseCaseV0 {
  id: number | null
  name: string
  type: EvaluationType
  contextVariables: ContextVariableV0[]
  responseVariableName: string
  responses: string[]
  criteria: CriteriaWithOptionsV0 | CriteriaV0
  results: ResultsV0
  expectedResults: null | string[]
  pipeline: string | null
}

export interface UseCaseV1 extends Omit<UseCaseV0, 'pipeline'> {
  pipeline: Evaluator | null
}

export interface UseCaseV2 extends Omit<UseCaseV1, 'criteria' | 'pipeline' | 'results'> {
  evaluator: Evaluator | null
  criteria: CriteriaWithOptionsV1 | CriteriaV1
  results: ResultsV1
}

export interface UseCaseV3 extends Omit<UseCaseV2, 'results' | 'contextVariables' | 'responses' | 'expectedResults'> {
  instances: Instance[]
}

export interface SyntheticGenerationConfig {
  task: TaskEnum | null
  domain: DomainEnum | null
  persona: PersonaEnum | null
  generationLength: GenerationLengthEnum | null
  evaluator: Evaluator | null
  perCriteriaOptionCount: Record<string, number> | null
  borderlineCount: number | null
}

export interface UseCaseV4 extends UseCaseV3 {
  syntheticGenerationConfig: SyntheticGenerationConfig
}

export type UseCase = UseCaseV4

export enum EvaluationType {
  DIRECT = 'direct',
  OLD_DIRECT = 'direct_assessment',
  OLD_RUBRIC = 'rubric',
  PAIRWISE = 'pairwise',
  OLD_PAIRWISE = 'pairwise_comparison',
  OLD_ALL_VS_ALL_PAIRWISE = 'all_vs_all_pairwise',
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
  criteria: string
  options: OptionV0[]
}

export interface CriteriaWithOptionsV1 extends Omit<CriteriaWithOptionsV0, 'criteria' | 'options'> {
  description: string
  options: OptionV1[]
}

export type CriteriaWithOptions = CriteriaWithOptionsV1

export interface CriteriaV0 {
  name: string
  criteria: string
}

export interface CriteriaV1 extends Omit<CriteriaV0, 'criteria'> {
  description: string
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

export enum DomainEnum {
  NewsMedia = 'News Media',
  Healthcare = 'Healthcare',
  EntertainmentAndPopCulture = 'Entertainment And Pop Culture',
  SocialMedia = 'Social Media',
  CustomerSupportAndBusiness = 'Customer Support And Business',
  GamingAndEntertainment = 'Gaming And Entertainment',
}

export enum PersonaEnum {
  ExperiencedJournalist = 'Experienced journalist',
  NoviceJournalist = 'Novice journalist',
  OpinionColumnist = 'Opinion columnist',
  NewsAnchor = 'News anchor',
  Editor = 'Editor',
  MedicalResearcher = 'Medical researcher',
  GeneralPractitioner = 'General practitioner',
  PublicHealthOfficial = 'Public health official',
  HealthBlogger = 'Health blogger',
  MedicalStudent = 'Medical student',
  FilmCritic = 'Film critic',
  CasualSocialMediaUser = 'Casual social media user',
  TabloidReporter = 'Tabloid reporter',
  HardcoreFanTheorist = 'Hardcore fan/Theorist',
  InfluencerYouTubeReviewer = 'Influencer/Youtube reviewer',
  InfluencerPositiveBrand = 'Influencer (Positive brand)',
  InternetTroll = 'Internet troll',
  PoliticalActivistPolarizing = 'Political activist (polarizing)',
  BrandVoiceCorporateSocialMediaAccount = 'Brand voice (Corporate social media account)',
  Memer = 'Memer (Meme creator)',
  CustomerServiceAgent = 'Customer service agent',
  AngryCustomer = 'Angry customer',
  CorporateCEO = 'Corporate CEO',
  ConsumerAdvocate = 'Consumer advocate',
  MarketingSpecialist = 'Marketing specialist',
  FlamerAggressivePlayer = 'Flamer (Aggressive player)',
  HardcoreGamer = 'Hardcore gamer',
  EsportCommentator = 'Esport commentator',
  MovieCritic = 'Movie critic',
  Fan = 'Fan (of a TV show, movie, or game)',
}

export enum TaskEnum {
  Summarization = 'Summarization',
  TextGeneration = 'Text Generation',
  QuestionAnswering = 'Question Answering',
}
export enum GenerationLengthEnum {
  Short = 'Short',
  Medium = 'Medium',
  Long = 'Long',
}
