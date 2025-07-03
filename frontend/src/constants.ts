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
      name: 'summarization_quality',
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
      predictionField: 'summary',
      contextFields: ['article'],
    },
    {
      name: 'fairness',
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
      predictionField: 'response',
      contextFields: [],
    },
  ],
  pairwise: [],
}
