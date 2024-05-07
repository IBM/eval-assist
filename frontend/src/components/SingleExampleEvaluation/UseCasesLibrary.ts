import { Rubric, UseCase } from './types'

export const useCases: UseCase[] = [
  {
    name: 'Temperature',
    id: null,
    context: 'How is the weather there?',
    responses: [
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit. The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
    ],
    rubric: {
      title: 'Temperature',
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
  },
  {
    name: 'RQA Quality',
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
    rubric: {
      title: 'Answer relevance',
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
  },
]
