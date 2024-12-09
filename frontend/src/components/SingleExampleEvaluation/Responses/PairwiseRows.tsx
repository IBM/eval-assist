import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { Dispatch, SetStateAction, useMemo } from 'react'

import { Link, Select, SelectItem } from '@carbon/react'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'
import RemovableSection from '@components/RemovableSection/RemovableSection'
import { getOrdinalSuffix, toPercentage } from '@utils/utils'

import { PairwiseComparisonResults, PerResponsePairwiseResult, UseCase } from '../../../types'
import classes from './index.module.scss'

interface Props {
  responses: UseCase['responses']
  setResponses: (responses: UseCase['responses']) => void
  results: PairwiseComparisonResults
  setResults: (results: UseCase['results']) => void
  explanationOn: boolean
  expectedResultOn: boolean
  setSelectedResultDetails: Dispatch<
    SetStateAction<{ result: PerResponsePairwiseResult | null; expectedResult: string; responseIndex: string }>
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
  setResults,
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
  const ranking = useMemo(() => (results !== null ? Object.values(results).map((r) => r.ranking) : []), [results])

  const onResultBlockClick = (i: number) => {
    setSelectedResultDetails({
      result: Object.values(results)[i],
      expectedResult: expectedResults !== null ? expectedResults[i] : '',
      responseIndex: Object.keys(results)[i],
    })
    setResultDetailsModalOpen(true)
  }

  const getResultToDisplay = (i: number) => {
    if (results !== null) {
      if (i >= ranking.length) {
        // there are no results for this response
        return ''
      }
      return `Ranking: ${ranking[i]}${getOrdinalSuffix(ranking[i])} (${toPercentage(
        // perResponseResults is a dict, and the value may have been deleted!
        Object.values(results)[i].winrate,
      )} winrate)`
    }
  }

  const onRemoveResponse = (i: number) => {
    if (responses.length === 1) return
    setResponses(responses.filter((_, j) => i !== j))
    if (results !== null) {
      const resultsCopy = { ...results }
      delete resultsCopy[i]
      setResults(resultsCopy)
    }

    expectedResults !== null &&
      setExpectedResults(
        expectedResults
          .filter((_, j) => i !== j)
          // set to '' the expected results that are no longer valid
          .map((expectedRanking, j) => (+expectedRanking > i ? '' : expectedRanking)),
      )
  }

  return (
    <>
      {responses?.map((response, i) => (
        <RemovableSection
          key={i}
          onRemove={() => onRemoveResponse(i)}
          readOnly={responses.length <= 2 || evaluationRunning}
        >
          {({ setActive, setInactive }) => (
            <div
              key={i}
              className={cx(classes.tableRow, classes.responsesRow, {
                [classes.winnerResponseOutline]: !evaluationRunning && i === pairwiseWinnerIndex,
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
                placeholder="The text to evaluate"
                key={`${i}_1`}
                className={cx(classes.blockElement)}
              />
              {/* Expected result */}
              {expectedResultOn && (
                <div className={cx(classes.blockElement, classes.resultBlock)}>
                  <Select
                    id={`select-2`}
                    noLabel
                    value={expectedResults !== null && expectedResults[i] !== '' ? expectedResults[i] : ''}
                    onChange={(e) => {
                      expectedResults !== null &&
                        setExpectedResults([
                          ...expectedResults.slice(0, i),
                          e.target.value,
                          ...expectedResults.slice(i + 1),
                        ])
                    }}
                  >
                    <SelectItem key={`${i}-empty`} value={''} text={''} />
                    {expectedResults !== null &&
                      responses.map((_, j) => (
                        <SelectItem key={j} text={`${j + 1}${getOrdinalSuffix(j + 1)}`} value={`${j + 1}`} />
                      ))}
                  </Select>
                </div>
              )}
              {results !== null && !evaluationRunning ? (
                i < ranking.length ? (
                  <>
                    <div
                      className={cx(
                        classes.blockElement,
                        classes.resultBlock,
                        classes.resultBlockPointerCursor,
                        classes.resultBlockHover,
                      )}
                      onClick={() => onResultBlockClick(i)}
                      tabIndex={-1}
                    >
                      <div className={classes.resultBlockOuter}>
                        <div className={classes.resultBlockInner}>
                          {i === pairwiseWinnerIndex && (
                            <div
                              className={cx(classes.resultBlockTypography, {
                                [classes.untrastedResultTypography]:
                                  (results !== null &&
                                    Object.values(results)[i].positionalBias.some((pBias) => pBias === true)) ||
                                  (expectedResults !== null &&
                                    expectedResults[i] !== '' &&
                                    +expectedResults[i] !== Object.values(results)[i].ranking),
                              })}
                            >
                              <strong>{'Winner'}</strong>
                            </div>
                          )}

                          <div className={cx(classes.resultBlockTypography, {})}>{getResultToDisplay(i)}</div>
                          {Object.values(results)[i].positionalBias.some((pBias) => pBias === true) && (
                            <div className={cx(classes.positionalBias)}>{'Positional bias detected'}</div>
                          )}
                          {expectedResults !== null && expectedResults[i] !== '' && (
                            <div
                              className={cx(classes.resultBlockTypography, {
                                [classes.untrastedResultTypography]: ranking[i] !== +expectedResults[i],
                                [classes.softText]: ranking[i] === +expectedResults[i],
                              })}
                            >{`Agreement: ${ranking[i] === +expectedResults[i] ? 'Yes' : 'No'}`}</div>
                          )}
                        </div>
                        <Link style={{ alignSelft: 'flex-end' }} className={classes.resultDetailsAction}>
                          View Details
                        </Link>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className={cx(classes.blockElement, classes.resultBlock)} tabIndex={-1}></div>
                    <div className={cx(classes.blockElement, classes.resultBlock)} tabIndex={-1}></div>
                  </>
                )
              ) : null}
            </div>
          )}
        </RemovableSection>
      ))}
    </>
  )
}
