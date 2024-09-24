import cx from 'classnames'
import { v4 as uuid } from 'uuid'

import { Dispatch, SetStateAction } from 'react'

import { Link, Select, SelectItem } from '@carbon/react'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'

import { RubricCriteria, RubricResult, UseCase } from '../../../types'
import RemovableSection from '../../RemovableSection/RemovableSection'
import classes from './index.module.scss'

interface Props {
  responses: UseCase['responses']
  setResponses: (responses: UseCase['responses']) => void
  results: RubricResult[] | null
  setResults: (results: UseCase['results']) => void
  explanationOn: boolean
  expectedResultOn: boolean
  setSelectedResultDetails: Dispatch<
    SetStateAction<{ result: RubricResult | null; expectedResult: string; responseIndex: string }>
  >
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
  evaluationRunning: boolean
  criteria: RubricCriteria
  setExpectedResults: (expectedResults: UseCase['expectedResults']) => void
  expectedResults: UseCase['expectedResults']
  gridClasses: {
    [x: string]: boolean
  }
}

export const RubricRows = ({
  responses,
  setResponses,
  results,
  explanationOn,
  setSelectedResultDetails,
  setResultDetailsModalOpen,
  evaluationRunning,
  criteria,
  expectedResultOn,
  expectedResults,
  setExpectedResults,
  setResults,
  gridClasses,
}: Props) => {
  const onResultBlockClick = (i: number) => {
    if (results !== null && results[i] !== undefined) {
      setSelectedResultDetails({
        result: results[i],
        expectedResult: expectedResults !== null ? expectedResults[i] : '',
        responseIndex: `${i + 1}`,
      })
      setResultDetailsModalOpen(true)
    }
  }
  const getResultToDisplay = (i: number) => {
    if (results !== null) {
      return results[i] ? (results[i] as RubricResult).option : ''
    }
    return ''
  }

  const onRemoveResponse = (i: number) => {
    if (responses.length === 1) return
    setResponses(responses.filter((_, j) => i !== j))
    results !== null && setResults(results.filter((_, j) => i !== j) as UseCase['results'])
    expectedResults !== null && setExpectedResults(expectedResults.filter((_, j) => i !== j))
  }

  return (
    <>
      {responses?.map((response, i) => (
        <RemovableSection
          key={i}
          onRemove={() => onRemoveResponse(i)}
          readOnly={responses.length === 1 || evaluationRunning}
        >
          {({ setActive, setInactive }) => (
            <div
              key={i}
              className={cx(classes.tableRow, classes.responsesRow, {
                ...gridClasses,
              })}
            >
              {/* Response */}
              <FlexTextArea
                onChange={(e) => {
                  setResponses([...responses.slice(0, i), e.target.value, ...responses.slice(i + 1)])
                }}
                value={response}
                id="text-area-model-output"
                labelText={''}
                placeholder="The response/text to evaluate."
                key={`${i}_1`}
                onFocus={setActive}
                onBlur={setInactive}
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
                    <SelectItem key={i} value={''} text={''} />
                    {criteria.options
                      .map((option) => option.option)
                      .map((option, i) => (
                        <SelectItem key={i} text={option} value={option} />
                      ))}
                  </Select>
                </div>
              )}

              {/* Result */}
              {results !== null && !evaluationRunning && (
                <>
                  <div
                    className={cx(classes.blockElement, classes.resultBlock, {
                      [classes.resultBlockPointerCursor]: results[i] !== undefined,

                      [classes.resultBlockHover]: results[i] !== undefined,
                    })}
                    onClick={() => onResultBlockClick(i)}
                    tabIndex={-1}
                  >
                    {results[i] !== undefined ? (
                      <div className={classes.resultBlockOuter}>
                        <div className={classes.resultBlockInner}>
                          <div
                            className={cx(classes.resultBlockTypography, {
                              [classes.untrastedResultTypography]:
                                results[i].positionalBias ||
                                (expectedResults !== null &&
                                  expectedResults[i] !== '' &&
                                  results[i].option !== expectedResults[i]),
                            })}
                            onFocus={setActive}
                            onBlur={setInactive}
                          >
                            {getResultToDisplay(i) ? <strong>{getResultToDisplay(i)}</strong> : ''}
                          </div>
                          {results[i].positionalBias && (
                            <div className={cx(classes.positionalBias)}>{'Positional bias detected'}</div>
                          )}

                          {results[i] && expectedResults !== null && expectedResults[i] !== '' && (
                            <div
                              className={cx(classes.resultBlockTypography, {
                                [classes.untrastedResultTypography]: results[i].option !== expectedResults[i],
                                [classes.softText]: results[i].option === expectedResults[i],
                              })}
                            >{`Agreement: ${results[i].option === expectedResults[i] ? 'Yes' : 'No'}`}</div>
                          )}
                          {/* {results[i].certainty && (
                            <div className={cx(classes.softText)}>
                              {'Certainty: ' + ((results[i].certainty as number) * 100).toFixed(0) + '%'}
                            </div>
                          )} */}
                        </div>
                        <Link style={{ alignSelf: 'flex-end' }} className={classes.resultDetailsAction}>
                          View Details
                        </Link>
                      </div>
                    ) : null}
                  </div>

                  {/* Explanation */}
                  {explanationOn && (
                    <FlexTextArea
                      readOnly
                      value={results[i] !== undefined ? results[i].explanation : undefined}
                      labelText={''}
                      placeholder=""
                      key={`rubric_${i}_3_${uuid()}`}
                      id={`rubric_${i}_3_${uuid()}`}
                      onFocus={setActive}
                      onBlur={setInactive}
                      className={cx(classes.blockElement, classes.resultBlockDefaultCursor, classes.explanationBlock)}
                      tabIndex={-1}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </RemovableSection>
      ))}
    </>
  )
}
