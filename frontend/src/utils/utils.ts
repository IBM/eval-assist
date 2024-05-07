import { Option, Result, Rubric, UseCase } from '@components/SingleExampleEvaluation/types'
import { StoredUseCase } from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'

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

export const parseFetchedUseCase = (fetchedUseCase: StoredUseCase): UseCase => {
  return {
    id: fetchedUseCase.id,
    name: fetchedUseCase.name,
    context: (fetchedUseCase.content as JsonObject)['context'] as string,
    responses: (fetchedUseCase.content as JsonObject)['responses'] as string[],
    rubric: (fetchedUseCase.content as JsonObject)['rubric'] as unknown as Rubric,
    results: (fetchedUseCase.content as JsonObject)['results'] as unknown as Result[],
  }
}

export const getEmptyRubric = () => ({
  title: '',
  criteria: '',
  options: [
    {
      option: '',
      description: '',
    },
    {
      option: '',
      description: '',
    },
  ],
})

export const getEmptyUseCase = (): UseCase => ({
  name: '',
  id: null,
  context: '',
  responses: [''],
  rubric: getEmptyRubric(),
  results: null,
})
