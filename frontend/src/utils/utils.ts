import { Option, Rubric } from '@components/SingleExampleEvaluation'

export const isInstanceOfOption = (obj: any): obj is Option => {
  return typeof obj.option === 'string' && typeof obj.description === 'string'
}

export const isInstanceOfRubric = (obj: any): obj is Rubric => {
  return (
    typeof obj.title === 'string' &&
    typeof obj.criteria === 'string' &&
    obj.options.every((o: Option) => isInstanceOfOption(o))
  )
}
