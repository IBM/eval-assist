import { returnByPipelineType } from 'src/utils'

import { CSSProperties, Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'

import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'

import { Criteria, CriteriaWithOptions, EvaluationType } from '../../../types'
import { PairwiseCriteriaView } from './PairwiseCriteriaView'
import { RubricCriteriaView } from './RubricCriteriaView'

interface Props {
  criteria: CriteriaWithOptions | Criteria
  setCriteria: (criteria: CriteriaWithOptions | Criteria) => void
  type: EvaluationType
  temporaryId: string
  className?: string | undefined
  style?: CSSProperties | undefined
}

export const CriteriaView = ({ type, criteria, setCriteria, temporaryId, className, style }: Props) => {
  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const { currentTestCase, showingTestCase } = useCurrentTestCase()

  const toHighlightWords = useMemo(() => {
    return showingTestCase
      ? {
          contextVariables: currentTestCase.contextVariableNames,
          responseVariableName: currentTestCase.responseVariableName,
        }
      : {
          contextVariables: [],
          responseVariableName: '',
        }
  }, [currentTestCase.contextVariableNames, currentTestCase.responseVariableName, showingTestCase])

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
