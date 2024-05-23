import { PipelineType, UseCase } from './types'

export const useCases: UseCase[] = [
  {
    name: 'Temperature',
    type: PipelineType.RUBRIC,
    id: null,
    context: 'How is the weather there?',
    responses: [
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit. The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
    ],
    criteria: {
      name: 'Temperature',
      criteria: 'Is temperature described in both Fahrenheit and Celsius?',
      options: [
        {
          option: 'Yes',
          description: 'The temperature is described in both Fahrenheit and Celsius.',
        },
        {
          option: 'No',
          description: 'The temperature is described either in Fahrenheit or Celsius but not both.',
        },
      ],
    },
    results: null,
    pipeline: null,
  },
  {
    name: 'RQA Quality',
    type: PipelineType.RUBRIC,
    id: null,
    context: 'What will become of my apprenticeship if I have to self-isolate due to COVID-19?',
    responses: [
      `Guidance for apprentices, employers, training providers, end-point assessment organisations (EPAOs) and external quality assurance providers about changes to apprenticeships due to coronavirus (COVID-19)
Apprenticeship training frequently asked questions
I need to take care of myself/a family member. Can I continue my apprenticeship learning at home?
Yes, this may be possible, depending on your apprenticeship and whether
e-learning is available from your training provider. Please check their
website or contact them to discuss your options.`,
    ],
    criteria: {
      name: 'Answer relevance',
      criteria: 'Does the response directly answer the question?',
      options: [
        {
          option: 'Excellent',
          description: 'The response directly answers the question.',
        },
        {
          option: 'Acceptable',
          description: 'The response is adequate but could be better.',
        },
        {
          option: 'Could be Improved',
          description: 'The response relates to the questions but does not directly answer it.',
        },
        {
          option: 'Bad',
          description: 'The response does not answer the question at all.',
        },
      ],
    },
    results: null,
    pipeline: null,
  },
  {
    name: 'Temperature 2',
    type: PipelineType.PAIRWISE,
    id: null,
    context: 'How is the weather there?',
    responses: [
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit. The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
    ],
    criteria: {
      name: 'Temperature',
      criteria: 'The temperature described in both Fahrenheit and Celsius.',
    },
    results: null,
    pipeline: null,
  },
  {
    name: 'Conciseness',
    type: PipelineType.RUBRIC,
    id: null,
    context: 'What are the benefits of drinking green tea?',
    responses: [
      'Drinking green tea offers several benefits, including improved brain function, fat loss, a lower risk of cancer, and a reduced risk of heart disease. It is rich in antioxidants and nutrients that can positively affect overall health.',
      "Green tea, with its rich infusion of polyphenolic catechins and theanine, synergistically interacts with the neural pathways to potentially enhance cognitive acuity while simultaneously orchestrating lipid oxidation processes to facilitate adipose reduction. The antioxidative properties inherent in its biochemical composition may contribute to oncological risk mitigation. Moreover, its cardiovascular implications include modulating lipid profiles and vascular endothelial function, ostensibly lowering morbidity associated with cardiovascular anomalies. Thus, green tea's multifaceted impact spans a broad spectrum of physiological and potentially psychological benefits.",
    ],
    criteria: {
      name: 'Conciseness',
      criteria: 'Is the response concise and to the point?',
      options: [
        {
          option: 'Yes',
          description: 'The response is short, succinct and directly addresses the point at hand.',
        },
        {
          option: 'No',
          description: 'The response lacks brevity and clarity, failing to directly address the point at hand.',
        },
      ],
    },
    results: null,
    pipeline: null,
  },
]
