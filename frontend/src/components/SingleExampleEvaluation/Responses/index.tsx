import cx from 'classnames'

import { CSSProperties, Dispatch, SetStateAction, useMemo, useState } from 'react'

import { Toggle } from '@carbon/react'

import { useThemeContext } from '@components/ThemeProvider/ThemeProvider'
import { returnByPipelineType } from '@utils/utils'

import { PairwiseResult, PipelineType, RubricResult } from '../types'
import { PairwiseRows } from './PairwiseRows'
import { RubricRows } from './RubricRows'
import classes from './index.module.scss'

interface Props {
  responses: string[]
  setResponses: Dispatch<SetStateAction<string[]>>
  style?: CSSProperties
  className?: string
  type: PipelineType
  results: (RubricResult | PairwiseResult)[] | null
  setResults: Dispatch<SetStateAction<(RubricResult | PairwiseResult)[] | null>>
  evaluationRunning: boolean
  setSelectedResultDetails: Dispatch<SetStateAction<RubricResult | PairwiseResult | null>>
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
}

export const Responses = ({
  responses,
  setResponses,
  style,
  className,
  type,
  results,
  setResults,
  evaluationRunning,
  setSelectedResultDetails,
  setResultDetailsModalOpen,
}: Props) => {
  const { isDarkMode } = useThemeContext()
  const [explanationOn, setExplanationOn] = useState(true)
  const pairwiseWinnerIndex = useMemo(() => {
    if (results === null || results.length === 0 || type !== PipelineType.PAIRWISE) return null
    return (results[0] as PairwiseResult).winnerIndex
  }, [results, type])

  const onRemoveResponse = (i: number) => {
    if (responses.length === 1) return
    setResponses(responses.filter((_, j) => i !== j))
    results !== null && setResults(results.filter((_, j) => i !== j))
  }

  return (
    <div style={style} className={className}>
      <div className={classes.content}>
        {results !== null && (
          <Toggle
            labelText={explanationOn ? 'Explanation On' : 'Explanation Off'}
            toggled={explanationOn}
            onToggle={() => setExplanationOn(!explanationOn)}
            size="sm"
            hideLabel
            id="toggle-explanation"
            className={classes.toggle}
          />
        )}
        <div className={cx(classes.innerContainer)}>
          <div
            className={cx(classes.tableRow, {
              [classes.tableRowWithResults]: results !== null,
              [classes.tableRowWithExplanation]: results !== null && explanationOn,
            })}
          >
            <strong className={cx(classes.blockElement, classes.headerBlock, classes.headerTypography)}>
              {type === PipelineType.RUBRIC ? 'Responses to evaluate' : 'Responses to compare'}
            </strong>
            {results !== null && (
              <div style={{ display: 'flex' }} className={cx(classes.blockElement, classes.headerBlock)}>
                <strong className={classes.headerTypography}>{'Result'}</strong>
              </div>
            )}
            {results !== null && explanationOn && (
              <strong className={cx(classes.blockElement, classes.headerBlock, classes.headerTypography)}>
                {'Explanation'}
              </strong>
            )}
          </div>
          {returnByPipelineType(
            type,
            <RubricRows
              responses={responses}
              setResponses={setResponses}
              results={results as RubricResult[]}
              onRemoveResponse={onRemoveResponse}
              explanationOn={explanationOn}
              setSelectedResultDetails={setSelectedResultDetails}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
            />,
            <PairwiseRows
              responses={responses}
              setResponses={setResponses}
              results={results as PairwiseResult[]}
              explanationOn={explanationOn}
              setSelectedResultDetails={setSelectedResultDetails}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              pairwiseWinnerIndex={pairwiseWinnerIndex}
            />,
          )}
        </div>
      </div>
    </div>
  )
}
