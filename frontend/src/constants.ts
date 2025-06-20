import { ModelProviderType } from '@types'

export const PLATFORM_NAME = 'EvalAssist'
export const PAIRWISE_NAME = 'Pairwise Comparison'
export const DIRECT_NAME = 'Direct Assessment'

export const modelProviderBeautifiedName: Record<ModelProviderType, string> = {
  [ModelProviderType.WATSONX]: 'Watsonx',
  [ModelProviderType.OPENAI]: 'OpenAI',
  [ModelProviderType.OPENAI_LIKE]: 'OpenAI Compatible',
  [ModelProviderType.RITS]: 'RITS',
  [ModelProviderType.AZURE]: 'Azure',
  [ModelProviderType.LOCAL_HF]: 'Local HF',
  [ModelProviderType.TOGETHER_AI]: 'Together AI',
  [ModelProviderType.AWS]: 'AWS/Bedrock',
  [ModelProviderType.VERTEX_AI]: 'Vertex AI',
  [ModelProviderType.REPLICATE]: 'Replicate',
  [ModelProviderType.OLLAMA]: 'Ollama',
}

export const INSTANCES_PER_PAGE = 10

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

export enum DirectActionTypeEnum {
  Regenerate = 'Regenerate',
  Rephrase = 'Rephrase',
  Elaborate = 'Elaborate',
  Shorten = 'Shorten',
  Custom = 'Custom',
}

export const BACKEND_API_HOST = process.env.NEXT_PUBLIC_BACKEND_API_HOST || '' // '' means the next app was exported statically and is served by the FastAPI backend
export const USE_AUTH = process.env.NEXT_PUBLIC_USE_AUTH === 'true' // '' means the next app was exported statically and is served by the FastAPI backend
export const USE_STORAGE =
  process.env.NEXT_PUBLIC_USE_STORAGE !== undefined ? process.env.NEXT_PUBLIC_USE_STORAGE === 'true' : true
