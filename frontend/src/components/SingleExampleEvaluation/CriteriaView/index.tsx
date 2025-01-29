import { returnByPipelineType } from 'src/utils'

import { CSSProperties, Dispatch, SetStateAction, useEffect, useState } from 'react'

import { Criteria, CriteriaWithOptions, EvaluationType } from '../../../types'
import { PairwiseCriteriaView } from './PairwiseCriteriaView'
import { RubricCriteriaView } from './RubricCriteriaView'

interface Props {
  criteria: CriteriaWithOptions | Criteria
  setCriteria: (criteria: CriteriaWithOptions | Criteria) => void
  type: EvaluationType
  toHighlightWords: {
    contextVariables: string[]
    responseVariableName: string
  }
  temporaryId: string
  className?: string | undefined
  style?: CSSProperties | undefined
}

export const CriteriaView = ({
  type,
  criteria,
  setCriteria,
  temporaryId,
  toHighlightWords,
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
      rubricCriteria={criteria as CriteriaWithOptions}
      setCriteria={setCriteria as Dispatch<SetStateAction<CriteriaWithOptions>>}
      selectedTabIndex={selectedTabIndex}
      setSelectedTabIndex={setSelectedTabIndex}
      toHighlightWords={toHighlightWords}
      className={className}
      style={style}
    />,
    <PairwiseCriteriaView
      pairwiseCriteria={criteria as Criteria}
      setCriteria={setCriteria as Dispatch<SetStateAction<Criteria>>}
      selectedTabIndex={selectedTabIndex}
      setSelectedTabIndex={setSelectedTabIndex}
      toHighlightWords={toHighlightWords}
      style={style}
      className={className}
    />,
  )
}
