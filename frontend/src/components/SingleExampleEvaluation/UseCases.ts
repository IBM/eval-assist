import { Rubric } from './types'

export interface UseCase {
  name: string
  context: string
  responses: string[]
  rubric: Rubric
}

export const useCases: UseCase[] = [
  {
    name: 'Temperature',
    context: 'How is the weather there?',
    responses: [
      'On most days, the weather is warm and humid, with temperatures often soaring into the high 80s and low 90s Fahrenheit (around 31-34°C). The dense foliage of the jungle acts as a natural air conditioner, keeping the temperature relatively stable and comfortable for the inhabitants.',
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
        {
          option: 'None',
          description: 'A numerical temperature is not mentioned.',
        },
      ],
    },
  },
]
