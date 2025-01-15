import { useCallback } from 'react'

import { useCriteriasContext } from '@components/SingleExampleEvaluation/Providers/CriteriasProvider'
import { DirectAssessmentCriteria, EvaluationType, PairwiseComparisonCriteria, UseCase } from '@types'
import { capitalizeFirstWord, getEmptyCriteria, getEmptyUseCase, returnByPipelineType } from '@utils/utils'

export const useCriterias = () => {
  const { directCriterias, pairwiseCriterias } = useCriteriasContext()

  const getCriteria = useCallback(
    (name: string, type: EvaluationType): DirectAssessmentCriteria | PairwiseComparisonCriteria | null => {
      if (!directCriterias || !pairwiseCriterias) return null
      const criteria = returnByPipelineType(type, directCriterias, pairwiseCriterias).find(
        (c) => c.name === capitalizeFirstWord(name),
      ) as DirectAssessmentCriteria | PairwiseComparisonCriteria | undefined
      return criteria ?? null
    },
    [directCriterias, pairwiseCriterias],
  )

  const getEmptyUseCaseWithCriteria = useCallback(
    (criteriaName: string, type: EvaluationType): UseCase => ({
      ...getEmptyUseCase(type),
      criteria: getCriteria(criteriaName, type) || getEmptyCriteria(type),
    }),
    [getCriteria],
  )

  return { directCriterias, pairwiseCriterias, getEmptyUseCaseWithCriteria, getCriteria }
}
