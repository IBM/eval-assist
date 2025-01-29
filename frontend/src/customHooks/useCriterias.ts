import { capitalizeFirstWord, getEmptyCriteriaByType, getEmptyUseCase, returnByPipelineType } from 'src/utils'

import { useCallback } from 'react'

import { useCriteriasContext } from '@components/SingleExampleEvaluation/Providers/CriteriasProvider'
import { Criteria, CriteriaWithOptions, EvaluationType, UseCase } from '@types'

export const useCriterias = () => {
  const { directCriterias, pairwiseCriterias } = useCriteriasContext()

  const getCriteria = useCallback(
    (name: string, type: EvaluationType): CriteriaWithOptions | Criteria | null => {
      if (!directCriterias || !pairwiseCriterias) return null
      const criteria = returnByPipelineType(type, directCriterias, pairwiseCriterias).find(
        (c) => c.name === capitalizeFirstWord(name),
      ) as CriteriaWithOptions | Criteria | undefined
      return criteria ?? null
    },
    [directCriterias, pairwiseCriterias],
  )

  const getEmptyUseCaseWithCriteria = useCallback(
    (criteriaName: string, type: EvaluationType): UseCase => ({
      ...getEmptyUseCase(type),
      criteria: getCriteria(criteriaName, type) || getEmptyCriteriaByType(type),
    }),
    [getCriteria],
  )

  return { directCriterias, pairwiseCriterias, getEmptyUseCaseWithCriteria, getCriteria }
}
