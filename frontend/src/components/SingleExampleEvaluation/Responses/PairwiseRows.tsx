import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { Dispatch, SetStateAction } from 'react'

import { Checkbox, Link, Select, SelectItem } from '@carbon/react'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'

import { PairwiseResult, RubricResult, UseCase } from '../../../utils/types'
import classes from './index.module.scss'

interface Props {
  responses: UseCase['responses']
  setResponses: (responses: UseCase['responses']) => void
  results: PairwiseResult[] | null
  explanationOn: boolean
  expectedResultOn: boolean
  setSelectedResultDetails: Dispatch<
    SetStateAction<{ result: RubricResult | PairwiseResult | null; expectedResult: string }>
  >
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
  pairwiseWinnerIndex: number | null
  evaluationRunning: boolean
  expectedResults: UseCase['expectedResults']
  setExpectedResults: (expectedResults: UseCase['expectedResults']) => void
  gridClasses: {
    [x: string]: boolean
  }
}

export const PairwiseRows = ({
  responses,
  setResponses,
  results,
  explanationOn,
  setSelectedResultDetails,
  setResultDetailsModalOpen,
  pairwiseWinnerIndex,
  evaluationRunning,
  expectedResultOn,
  expectedResults,
  setExpectedResults,
  gridClasses,
}: Props) => {
  const onResultBlockClick = (i: number) => {
    if (results !== null && results[0] !== undefined && pairwiseWinnerIndex === i) {
      setSelectedResultDetails({
        result: results[0],
        expectedResult: expectedResults !== null ? expectedResults[i] : '',
      })
      setResultDetailsModalOpen(true)
    }
  }

  const getResultToDisplay = (i: number) => {
    if (results !== null) {
      return i === pairwiseWinnerIndex ? 'Winner' : ''
    }
  }

  const onCheckboxClick = (i: number) => {
    const isChecked = expectedResults !== null && expectedResults[i] === 'Winner'
    if (isChecked) {
      setExpectedResults(['none', 'none'])
    } else {
      setExpectedResults([i === 0 ? 'Winner' : '', i === 0 ? '' : 'Winner'])
    }
  }

  return (
    <>
      {responses?.map((response, i) => (
        <div
          key={i}
          className={cx(classes.tableRow, classes.responsesRow, {
            [classes.winnerResponseOutline]: !evaluationRunning && i === pairwiseWinnerIndex,
            [classes.noBorderBottom]: pairwiseWinnerIndex === 1,
            ...gridClasses,
          })}
        >
          <FlexTextArea
            onChange={(e) => {
              setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)])
            }}
            value={response}
            id="text-area-model-output"
            labelText={''}
            placeholder="The response/text to evaluate."
            key={`${i}_1`}
            className={cx(classes.blockElement)}
          />
          {/* Expected result */}
          {expectedResultOn && (
            <div className={cx(classes.blockElement, classes.resultBlock)} tabIndex={-1}>
              <Checkbox
                id={`checkbox-${i}`}
                labelText="Winner"
                checked={expectedResults !== null && expectedResults[i] === 'Winner'}
                onChange={() => onCheckboxClick(i)}
              />
            </div>
          )}
          {results !== null && !evaluationRunning && (
            <>
              <div
                className={cx(classes.blockElement, classes.resultBlock, {
                  [classes.resultBlockPointerCursor]: results[0] !== undefined && pairwiseWinnerIndex === i,
                  [classes.resultBlockHover]: i === pairwiseWinnerIndex,
                })}
                onClick={() => onResultBlockClick(i)}
                tabIndex={-1}
              >
                <div className={classes.resultBlockOuter}>
                  <div className={classes.resultBlockInner}>
                    <div
                      className={cx(classes.resultBlockTypography, {
                        [classes.resultPlaceholder]: results === null || results[0] === undefined,
                        [classes.resultBlockDefaultCursor]: results === null || results[0] === undefined,
                        [classes.untrastedResultTypography]:
                          (results !== null && 'positionalBias' in results && results[0].positionalBias) ||
                          (expectedResults !== null &&
                            expectedResults[i] !== 'none' &&
                            expectedResults[i] !== 'Winner'),
                      })}
                    >
                      {getResultToDisplay(i) ? <strong>{getResultToDisplay(i)}</strong> : ''}
                    </div>
                    {pairwiseWinnerIndex === i && results[0] && (
                      <div
                        className={cx({
                          [classes.positionalBias]: results[0].positionalBias,
                          [classes.softText]: !results[0].positionalBias,
                        })}
                      >
                        {results[0].positionalBias ? 'Positional bias detected' : 'No positional bias'}
                      </div>
                    )}
                    {expectedResults !== null && expectedResults[i] !== 'none' && i === pairwiseWinnerIndex && (
                      <div
                        className={cx(classes.resultBlockTypography, {
                          [classes.untrastedResultTypography]: getResultToDisplay(i) !== expectedResults[i],
                          [classes.softText]: getResultToDisplay(i) === expectedResults[i],
                        })}
                      >
                        {`Agreement: ${expectedResults[i] === 'Winner' ? 'Yes' : 'No'}`}
                      </div>
                    )}
                    {results[0] && results[0].certainty && pairwiseWinnerIndex === i && (
                      <div className={cx(classes.softText)}>
                        {'Certainty: ' + ((results[0].certainty as number) * 100).toFixed(0) + '%'}
                      </div>
                    )}
                  </div>
                  {results[0] !== undefined && pairwiseWinnerIndex === i && (
                    <Link style={{ alignSelft: 'flex-end' }} className={classes.resultDetailsAction}>
                      View Details
                    </Link>
                  )}
                </div>
              </div>
              {explanationOn && (
                <FlexTextArea
                  readOnly
                  value={results[0] !== undefined && pairwiseWinnerIndex === i ? results[0].explanation : undefined}
                  labelText={''}
                  placeholder={''}
                  key={`pairwise_${i}_3_${uuid()}`}
                  id={`pairwise_${i}_3_${uuid()}`}
                  className={cx(classes.blockElement, classes.resultBlockDefaultCursor, classes.explanationBlock)}
                  tabIndex={-1}
                />
              )}
            </>
          )}
        </div>
      ))}
    </>
  )
}
