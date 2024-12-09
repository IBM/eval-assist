import { CSSProperties, Dispatch, SetStateAction, useEffect, useState } from 'react'

import { returnByPipelineType } from '@utils/utils'

import { DirectAssessmentCriteria, EvaluationType, PairwiseComparisonCriteria } from '../../../types'
import { PairwiseCriteriaView } from './PairwiseCriteriaView'
import { RubricCriteriaView } from './RubricCriteriaView'

interface Props {
  criteria: DirectAssessmentCriteria | PairwiseComparisonCriteria
  setCriteria: (criteria: DirectAssessmentCriteria | PairwiseComparisonCriteria) => void
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
      rubricCriteria={criteria as DirectAssessmentCriteria}
      setCriteria={setCriteria as Dispatch<SetStateAction<DirectAssessmentCriteria>>}
      selectedTabIndex={selectedTabIndex}
      setSelectedTabIndex={setSelectedTabIndex}
      toHighlightWords={toHighlightWords}
      className={className}
      style={style}
    />,
    <PairwiseCriteriaView
      pairwiseCriteria={criteria as PairwiseComparisonCriteria}
      setCriteria={setCriteria as Dispatch<SetStateAction<PairwiseComparisonCriteria>>}
      selectedTabIndex={selectedTabIndex}
      setSelectedTabIndex={setSelectedTabIndex}
      toHighlightWords={toHighlightWords}
      style={style}
      className={className}
    />,
  )
}
