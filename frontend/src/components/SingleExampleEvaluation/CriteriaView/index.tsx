import { CSSProperties, Dispatch, SetStateAction } from 'react'

import classes from '../SingleExampleEvaluation.module.scss'
import { PairwiseCriteria, PipelineType, RubricCriteria } from '../types'
import { PairwiseCriteriaView } from './PairwiseCriteriaView'
import { RubricCriteriaView } from './RubricCriteriaView'

interface Props {
  criteria: RubricCriteria | PairwiseCriteria
  setCriteria: Dispatch<SetStateAction<RubricCriteria | PairwiseCriteria>>
  type: PipelineType
  className?: string | undefined
  style?: CSSProperties | undefined
}

export const CriteriaView = ({ type, criteria, setCriteria, className, style }: Props) => {
  return type === PipelineType.RUBRIC ? (
    <RubricCriteriaView
      className={className}
      rubricCriteria={criteria as RubricCriteria}
      setCriteria={setCriteria as Dispatch<SetStateAction<RubricCriteria>>}
      style={style}
    />
  ) : (
    <PairwiseCriteriaView
      className={className}
      pairwiseCriteria={criteria as PairwiseCriteria}
      setCriteria={setCriteria as Dispatch<SetStateAction<PairwiseCriteria>>}
      style={style}
    />
  )
}
