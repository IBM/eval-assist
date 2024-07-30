import { CSSProperties, Dispatch, SetStateAction, useEffect, useState } from 'react'

import { returnByPipelineType } from '@utils/utils'

import { PairwiseCriteria, PipelineType, RubricCriteria } from '../../../utils/types'
import { PairwiseCriteriaView } from './PairwiseCriteriaView'
import { RubricCriteriaView } from './RubricCriteriaView'

interface Props {
  criteria: RubricCriteria | PairwiseCriteria
  setCriteria: (criteria: RubricCriteria | PairwiseCriteria) => void
  type: PipelineType
  contextVariableNames: string[]
  temporaryId: string
  className?: string | undefined
  style?: CSSProperties | undefined
}

export const CriteriaView = ({
  type,
  criteria,
  setCriteria,
  temporaryId,
  contextVariableNames,
  className,
  style,
}: Props) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)

  useEffect(() => {
    setSelectedTabIndex(0)
  }, [temporaryId])

  return returnByPipelineType(
    type,
    <RubricCriteriaView
      rubricCriteria={criteria as RubricCriteria}
      setCriteria={setCriteria as Dispatch<SetStateAction<RubricCriteria>>}
      selectedTabIndex={selectedTabIndex}
      setSelectedTabIndex={setSelectedTabIndex}
      contextVariableNames={contextVariableNames}
      className={className}
      style={style}
    />,
    <PairwiseCriteriaView
      pairwiseCriteria={criteria as PairwiseCriteria}
      setCriteria={setCriteria as Dispatch<SetStateAction<PairwiseCriteria>>}
      selectedTabIndex={selectedTabIndex}
      setSelectedTabIndex={setSelectedTabIndex}
      contextVariableNames={contextVariableNames}
      style={style}
      className={className}
    />,
  )
}
