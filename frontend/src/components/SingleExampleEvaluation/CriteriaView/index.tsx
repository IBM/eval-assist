import { CSSProperties, Dispatch, SetStateAction, useEffect, useState } from 'react'

import { PairwiseCriteria, PipelineType, RubricCriteria } from '../types'
import { PairwiseCriteriaView } from './PairwiseCriteriaView'
import { RubricCriteriaView } from './RubricCriteriaView'

interface Props {
  criteria: RubricCriteria | PairwiseCriteria
  setCriteria: Dispatch<SetStateAction<RubricCriteria | PairwiseCriteria>>
  type: PipelineType
  className?: string | undefined
  style?: CSSProperties | undefined
  temporaryId: string
}

export const CriteriaView = ({ type, criteria, setCriteria, temporaryId, className, style }: Props) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  useEffect(() => {
    setSelectedTabIndex(0)
  }, [temporaryId])

  return type === PipelineType.RUBRIC ? (
    <RubricCriteriaView
      rubricCriteria={criteria as RubricCriteria}
      setCriteria={setCriteria as Dispatch<SetStateAction<RubricCriteria>>}
      selectedTabIndex={selectedTabIndex}
      setSelectedTabIndex={setSelectedTabIndex}
      className={className}
      style={style}
    />
  ) : (
    <PairwiseCriteriaView
      pairwiseCriteria={criteria as PairwiseCriteria}
      setCriteria={setCriteria as Dispatch<SetStateAction<PairwiseCriteria>>}
      selectedTabIndex={selectedTabIndex}
      setSelectedTabIndex={setSelectedTabIndex}
      style={style}
      className={className}
    />
  )
}
