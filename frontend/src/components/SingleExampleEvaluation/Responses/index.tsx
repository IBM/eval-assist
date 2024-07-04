import cx from 'classnames'

import { CSSProperties, Dispatch, SetStateAction, useMemo, useState } from 'react'

import { Toggle } from '@carbon/react'

import { returnByPipelineType } from '@utils/utils'

import {
  PairwiseCriteria,
  PairwiseResult,
  PipelineType,
  RubricCriteria,
  RubricResult,
  UseCase,
} from '../../../utils/types'
import { PairwiseRows } from './PairwiseRows'
import { RubricRows } from './RubricRows'
import classes from './index.module.scss'

interface Props {
  responses: string[]
  setResponses: (responses: UseCase['responses']) => void
  style?: CSSProperties
  className?: string
  type: PipelineType
  results: UseCase['results']
  setResults: (results: UseCase['results']) => void
  evaluationRunning: boolean
  setSelectedResultDetails: Dispatch<
    SetStateAction<{ result: RubricResult | PairwiseResult | null; expectedResult: string }>
  >
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
  criteria: RubricCriteria | PairwiseCriteria
  expectedResults: UseCase['expectedResults']
  setExpectedResults: (expectedResults: UseCase['expectedResults']) => void
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
  criteria,
  expectedResults,
  setExpectedResults,
}: Props) => {
  const [explanationOn, setExplanationOn] = useState(true)
  const [expectedResultOn, setExpectedResultOn] = useState(true)
  const pairwiseWinnerIndex = useMemo(() => {
    if (results === null || results.length === 0 || type !== PipelineType.PAIRWISE) return null
    return (results[0] as PairwiseResult).winnerIndex
  }, [results, type])

  const gridClasses = useMemo(
    () => ({
      [classes.columns1]: !expectedResultOn && (results === null || evaluationRunning),
      [classes.columns2]:
        !explanationOn &&
        ((expectedResultOn && (results === null || evaluationRunning)) ||
          (!expectedResultOn && results !== null && !evaluationRunning)),
      [classes.columns3var1]: expectedResultOn && results !== null && !evaluationRunning && !explanationOn,
      [classes.columns3var2]: !expectedResultOn && results !== null && !evaluationRunning && explanationOn,
      [classes.columns4]: expectedResultOn && results !== null && !evaluationRunning && explanationOn,
    }),
    [evaluationRunning, expectedResultOn, explanationOn, results],
  )

  console.log('gridClasses')
  console.log(gridClasses)

  return (
    <div style={style} className={className}>
      <div className={classes.content}>
        <div className={cx(classes.innerContainer)}>
          <div
            className={cx(classes.tableRow, classes.headerRow, {
              [classes.noBorderBottom]: pairwiseWinnerIndex === 0,
              ...gridClasses,
            })}
          >
            <strong className={cx(classes.blockElement, classes.headerBlock, classes.headerTypography)}>
              {type === PipelineType.RUBRIC ? 'Responses to evaluate' : 'Responses to compare'}
            </strong>
            {expectedResultOn && (
              <div className={cx(classes.blockElement, classes.headerBlock)}>
                <strong className={cx(classes.headerTypography)}>{'Expected result'}</strong>
              </div>
            )}
            {results !== null && !evaluationRunning && (
              <div className={cx(classes.blockElement, classes.headerBlock)}>
                <strong className={classes.headerTypography}>{'Result'}</strong>
              </div>
            )}
            {results !== null && !evaluationRunning && explanationOn && (
              <div className={cx(classes.blockElement, classes.headerBlock)}>
                <strong className={cx(classes.headerTypography)}>{'Explanation'}</strong>
              </div>
            )}
          </div>
          {returnByPipelineType(
            type,
            <RubricRows
              responses={responses}
              setResponses={setResponses}
              results={results as RubricResult[]}
              setResults={setResults}
              explanationOn={explanationOn}
              expectedResultOn={expectedResultOn}
              setSelectedResultDetails={setSelectedResultDetails}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              evaluationRunning={evaluationRunning}
              criteria={criteria as RubricCriteria}
              expectedResults={expectedResults}
              setExpectedResults={setExpectedResults}
              gridClasses={gridClasses}
            />,
            <PairwiseRows
              responses={responses}
              setResponses={setResponses}
              results={results as PairwiseResult[]}
              explanationOn={explanationOn}
              expectedResultOn={expectedResultOn}
              expectedResults={expectedResults}
              setExpectedResults={setExpectedResults}
              setSelectedResultDetails={setSelectedResultDetails}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              pairwiseWinnerIndex={pairwiseWinnerIndex}
              evaluationRunning={evaluationRunning}
              gridClasses={gridClasses}
            />,
          )}
        </div>
      </div>
      {!evaluationRunning && type === PipelineType.RUBRIC && results?.every((result) => !result.positionalBias) && (
        <p style={{ marginTop: '0.5rem' }} className={classes.softText}>
          {'No positional bias was detected in any of the responses.'}
        </p>
      )}
      <div className={classes.toggles}>
        {results !== null && !evaluationRunning && (
          <Toggle
            labelText={'Show Explanation'}
            toggled={explanationOn}
            onToggle={() => setExplanationOn(!explanationOn)}
            size="sm"
            hideLabel
            id="toggle-explanation"
            className={classes.toggle}
          />
        )}
        <Toggle
          labelText={'Show expected result'}
          toggled={expectedResultOn}
          onToggle={() => setExpectedResultOn(!expectedResultOn)}
          size="sm"
          hideLabel
          id="toggle-expected-result"
          className={classes.toggle}
        />
      </div>
    </div>
  )
}
