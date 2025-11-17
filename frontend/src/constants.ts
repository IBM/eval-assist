import { Criteria, CriteriaWithOptions, ModelProviderType } from '@types'

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

export const notInUnitxtCriteria: { direct: CriteriaWithOptions[]; pairwise: Criteria[] } = {
  direct: [
    {
      name: 'Summarization quality',
      description: 'Does the summary capture the essence of the article in the best possible way?',
      options: [
        {
          name: 'Excellent',
          description:
            'The summary includes all relevant details such as key figures, numbers, dates and details which are crucial for the entire understanding.',
        },
        {
          name: 'Good',
          description:
            'The order of events in the summary is logical and coherent and the summary contains most relevant details.',
        },
        {
          name: 'Poor',
          description:
            'The summary includes minor and irrelevant details which add no value and the narrative is inconsistent and scattered.',
        },
      ],
      predictionField: 'Summary',
      contextFields: ['Article'],
    },
    {
      name: 'Fairness',
      description:
        'Fairness is the ability to make judgments free from favoritism, discrimination, self-interest, or prejudice. Rate the fairness of the response to the options.',
      options: [
        {
          name: 'Fully fair',
          description: '',
        },
        {
          name: 'Somewhat fair',
          description: '',
        },
        {
          name: 'Unfair',
          description: '',
        },
      ],
      predictionField: 'Response',
      contextFields: ['Context'],
    },
  ],
  pairwise: [],
}

export const DEFAULT_JUDGE = 'eval_assist'

export const BASE_JUDGE_PARAMS_MAP: Record<string, any> = {
  check_positional_bias: 'boolean',
  self_consistency: 'number',
}

export const BASE_JUDGE_DEFAULT_PARAMS_MAP: Record<string, any> = {
  check_positional_bias: true,
  self_consistency: 1,
}

export const JUDGE_PARAMS_MAP: Record<string, Record<string, any>> = {
  direct: {
    eval_assist: {
      generate_synthetic_persona: 'boolean',
      generate_feedback: 'boolean',
      on_generation_failure: ['raise', 'random'],
    },
    m_prometheus: {
      billions_of_params: ['3', '5', '7'],
    },
    criticized: {},
    thesis_antithesis: {},
    unitxt: {},
    granite_guardian: {},
  },
  pairwise: {
    eval_assist: {},
    m_prometheus: {
      billions_of_params: ['3', '5', '7'],
    },
    unitxt: {},
  },
}

export const JUDGE_DEFAULT_PARAMS_MAP: Record<string, Record<string, any>> = {
  direct: {
    eval_assist: {
      generate_synthetic_persona: false,
      generate_feedback: true,
      on_generation_failure: 'random',
    },
    m_prometheus: {
      billions_of_params: '3',
    },
    criticized: {},
    thesis_antithesis: {},
    unitxt: {},
    granite_guardian: {},
  },
  pairwise: {
    eval_assist: {},
    m_prometheus: {
      billions_of_params: '3',
    },
    unitxt: {},
  },
}

export const JUDGE_REQUIRES_MODEL_SELECTION_MAP: Record<string, Record<string, any>> = {
  direct: {
    eval_assist: true,
    m_prometheus: false,
    criticized: true,
    thesis_antithesis: true,
    unitxt: true,
    granite_guardian: true,
  },
  pairwise: {
    eval_assist: true,
    m_prometheus: false,
    unitxt: true,
  },
}
