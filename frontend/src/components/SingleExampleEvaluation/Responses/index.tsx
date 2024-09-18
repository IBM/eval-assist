import cx from 'classnames'

import { CSSProperties, ChangeEvent, Dispatch, SetStateAction, useMemo, useState } from 'react'

import { Button, Toggle } from '@carbon/react'
import { Add } from '@carbon/react/icons'

import { EditableTag } from '@components/EditableTag'
import { returnByPipelineType } from '@utils/utils'

import {
  PairwiseCriteria,
  PairwiseResults,
  PerResponsePairwiseResult,
  PipelineType,
  RubricCriteria,
  RubricResult,
  UseCase,
} from '../../../types'
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
    SetStateAction<{
      result: RubricResult | PerResponsePairwiseResult | null
      expectedResult: string
      responseIndex: string
    }>
  >
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
  criteria: RubricCriteria | PairwiseCriteria
  expectedResults: UseCase['expectedResults']
  setExpectedResults: (expectedResults: UseCase['expectedResults']) => void
  responseVariableName: string
  setResponseVariableName: (newValue: string) => void
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
  responseVariableName,
  setResponseVariableName,
}: Props) => {
  const [explanationOn, setExplanationOn] = useState(type === PipelineType.RUBRIC)
  const [expectedResultOn, setExpectedResultOn] = useState(true)

  const pairwiseWinnerIndex = useMemo(() => {
    if (results === null || type !== PipelineType.PAIRWISE) return null
    return (results as PairwiseResults).ranking.indexOf(0)
  }, [results, type])

  const rubricGridClasses = useMemo(
    () => ({
      [classes.columns1]: !expectedResultOn && (results === null || evaluationRunning),
      [classes.columns2]:
        (!explanationOn && results !== null && !expectedResultOn && !evaluationRunning) ||
        (expectedResultOn && results === null) ||
        (expectedResultOn && evaluationRunning),
      [classes.columns3var1]: expectedResultOn && results !== null && !evaluationRunning && !explanationOn,
      [classes.columns3var2]: !expectedResultOn && results !== null && !evaluationRunning && explanationOn,
      [classes.columns4]: expectedResultOn && results !== null && !evaluationRunning && explanationOn,
    }),
    [evaluationRunning, expectedResultOn, explanationOn, results],
  )

  const pairwiseGridClasses = useMemo(
    () => ({
      [classes.columns1]: !expectedResultOn && (results === null || evaluationRunning),
      [classes.columns2]:
        (results !== null && !expectedResultOn && !evaluationRunning) ||
        (expectedResultOn && results === null) ||
        (expectedResultOn && evaluationRunning),
      [classes.columns3var3]: expectedResultOn && results !== null && !evaluationRunning,
    }),
    [evaluationRunning, expectedResultOn, results],
  )

  const noPositionalBias = useMemo(() => {
    if (results === null) return
    return type === PipelineType.RUBRIC
      ? (results as RubricResult[])?.every((result) => result.positionalBias == false)
      : Object.values((results as PairwiseResults)?.perResponseResults).every((perResponseResults) =>
          perResponseResults.positionalBias.every((pBias) => pBias === false),
        )
  }, [results, type])

  const onAddResponse = () => {
    setResponses([...responses, ''])
    expectedResults !== null && setExpectedResults([...expectedResults, ''])
    if (type === PipelineType.PAIRWISE) {
    }
  }

  return (
    <div style={style} className={className}>
      <div className={classes.content}>
        <div className={cx(classes.innerContainer)}>
          <div
            className={cx(classes.tableRow, classes.headerRow, {
              [classes.noBorderBottom]: pairwiseWinnerIndex === 0,
              ...returnByPipelineType(type, rubricGridClasses, pairwiseGridClasses),
            })}
          >
            <div className={cx(classes.blockElement, classes.headerBlock, classes.headerResponseBlock)}>
              <strong className={cx(classes.headerTypography)}>
                {returnByPipelineType(type, 'Responses to evaluate', 'Responses to compare')}
              </strong>
              <EditableTag
                value={responseVariableName}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setResponseVariableName(e.target.value)}
                color="blue"
              />
            </div>
            {expectedResultOn && (
              <div className={cx(classes.blockElement, classes.headerBlock)}>
                <strong className={cx(classes.headerTypography)}>
                  {returnByPipelineType(type, 'Expected result', 'Expected ranking')}
                </strong>
              </div>
            )}
            {results !== null && !evaluationRunning && (
              <div className={cx(classes.blockElement, classes.headerBlock)}>
                <strong className={classes.headerTypography}>{'Result'}</strong>
              </div>
            )}
            {results !== null && !evaluationRunning && explanationOn && type === PipelineType.RUBRIC && (
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
              setSelectedResultDetails={
                setSelectedResultDetails as Dispatch<
                  SetStateAction<{ result: RubricResult | null; expectedResult: string; responseIndex: string }>
                >
              }
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              evaluationRunning={evaluationRunning}
              criteria={criteria as RubricCriteria}
              expectedResults={expectedResults}
              setExpectedResults={setExpectedResults}
              gridClasses={rubricGridClasses}
            />,
            <PairwiseRows
              responses={responses}
              setResponses={setResponses}
              results={results as PairwiseResults}
              setResults={setResults}
              explanationOn={explanationOn}
              expectedResultOn={expectedResultOn}
              expectedResults={expectedResults}
              setExpectedResults={setExpectedResults}
              setSelectedResultDetails={
                setSelectedResultDetails as Dispatch<
                  SetStateAction<{
                    result: PerResponsePairwiseResult | null
                    expectedResult: string
                    responseIndex: string
                  }>
                >
              }
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              pairwiseWinnerIndex={pairwiseWinnerIndex}
              evaluationRunning={evaluationRunning}
              gridClasses={pairwiseGridClasses}
            />,
          )}
          <div className={cx(classes.tableRow, classes.addResponseRow)}>
            <div className={cx(classes.blockElement, classes.addResponseBlock)}>
              <Button kind="ghost" size="sm" renderIcon={Add} onClick={onAddResponse}>
                {'Add response'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {!evaluationRunning && results !== null && noPositionalBias ? (
        <p style={{ marginTop: '0.5rem' }} className={classes.softText}>
          {'No positional bias was detected in any of the responses.'}
        </p>
      ) : null}
      <div className={classes.toggles}>
        {results !== null && !evaluationRunning && type === PipelineType.RUBRIC && (
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
