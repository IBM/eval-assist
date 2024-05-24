import {
  Option,
  PairwiseCriteria,
  PairwiseResult,
  PipelineType,
  RubricCriteria,
  RubricResult,
  UseCase,
} from '@components/SingleExampleEvaluation/types'
import { StoredUseCase } from '@prisma/client'
import { JsonObject } from '@prisma/client/runtime/library'

export const isInstanceOfOption = (obj: any): obj is Option =>
  typeof obj.option === 'string' && typeof obj.description === 'string'

export const isInstanceOfRubricCriteria = (obj: any): obj is RubricCriteria =>
  typeof obj.name === 'string' &&
  typeof obj.criteria === 'string' &&
  obj.options.every((o: Option) => isInstanceOfOption(o))

export const isInstanceOfPairwiseResult = (obj: any): obj is PairwiseResult =>
  typeof obj.name === 'string' &&
  typeof obj.winnerIndex === 'number' &&
  typeof obj.positionalBias === 'boolean' &&
  typeof obj.explanation === 'string' &&
  typeof obj.certainty === 'number'

export const isInstanceOfPairwiseCriteria = (obj: any): obj is RubricCriteria =>
  typeof obj.name === 'string' && typeof obj.criteria === 'string'

export const parseFetchedUseCase = (fetchedUseCase: StoredUseCase): UseCase => {
  const type = ((fetchedUseCase.content as JsonObject)['type'] as PipelineType) ?? PipelineType.RUBRIC
  return {
    id: fetchedUseCase.id,
    name: fetchedUseCase.name,
    type: type,
    context: (fetchedUseCase.content as JsonObject)['context'] as string,
    responses: (fetchedUseCase.content as JsonObject)['responses'] as string[],
    criteria:
      type === PipelineType.RUBRIC
        ? ((fetchedUseCase.content as JsonObject)['criteria'] as unknown as RubricCriteria)
        : ((fetchedUseCase.content as JsonObject)['criteria'] as unknown as PairwiseCriteria) ||
          // for backward compatibility
          ((fetchedUseCase.content as JsonObject)['rubric'] as unknown as RubricCriteria),
    results: (fetchedUseCase.content as JsonObject)['results'] as unknown as (RubricResult | PairwiseResult)[],
    pipeline: (fetchedUseCase.content as JsonObject)['pipeline'] as string,
  }
}

export const getEmptyRubricCriteria = (): RubricCriteria => ({
  name: '',
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

export const getEmptyPairwiseCriteria = (): PairwiseCriteria => ({
  name: '',
  criteria: '',
})

export const getEmptyCriteria = (type: PipelineType): RubricCriteria | PairwiseCriteria =>
  type === PipelineType.RUBRIC ? getEmptyRubricCriteria() : getEmptyPairwiseCriteria()

export const getEmptyUseCase = (type: PipelineType): UseCase => ({
  id: null,
  name: '',
  type: type,
  context: '',
  responses: [''],
  criteria: getEmptyRubricCriteria(),
  results: null,
  pipeline: null,
})

export const returnByPipelineType = (type: PipelineType, returnIfRubric: any, returnIfPairwise: any) =>
  type === PipelineType.RUBRIC ? returnIfRubric : returnIfPairwise
