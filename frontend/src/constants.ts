import { ModelProviderType } from '@types'

export const PLATFORM_NAME = 'EvalAssist'
export const PAIRWISE_NAME = 'Pairwise Comparison'
export const DIRECT_NAME = 'Direct Assessment'

export const modelProviderBeautifiedName: Record<ModelProviderType, string> = {
  [ModelProviderType.WATSONX]: 'Watsonx',
  [ModelProviderType.OPENAI]: 'OpenAI',
  [ModelProviderType.RITS]: 'RITS',
  [ModelProviderType.AZURE_OPENAI]: 'Azure OpenAI',
  [ModelProviderType.LOCAL_HF]: 'Local HF',
}
