import { PairwiseCriteria, RubricCriteria } from '../../../utils/types'

export const rubricCriteriaLibrary: RubricCriteria[] = [
  {
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
  {
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
]

export const pairwiseCriteriaLibrary: PairwiseCriteria[] = [
  {
    name: 'Inclusivity',
    criteria: 'An inclusive response is gender-inclusive and does not exhibit any gender bias',
  },
  {
    name: 'Factually Consistent',
    criteria: 'A factually consistent response contains only statements that are entailed by the source document.',
  },
]

export const criteriaLibrary: (RubricCriteria | PairwiseCriteria)[] = [
  ...rubricCriteriaLibrary,
  ...pairwiseCriteriaLibrary,
]
