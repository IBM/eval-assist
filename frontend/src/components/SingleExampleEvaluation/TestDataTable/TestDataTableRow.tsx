import cx from 'classnames'

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { Link, Select, SelectItem } from '@carbon/react'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'
import { returnByPipelineType } from '@utils/utils'

import {
  Criteria,
  CriteriaWithOptions,
  DirectAssessmentResult,
  DirectInstance,
  EvaluationType,
  Instance,
  PairwiseInstance,
  PerResponsePairwiseResult,
} from '../../../types'
import RemovableSection from '../../RemovableSection/RemovableSection'
import classes from './index.module.scss'

interface Props {
  explanationOn: boolean
  expectedResultOn: boolean
  setSelectedResultDetails: Dispatch<
    SetStateAction<{
      result: DirectAssessmentResult | PerResponsePairwiseResult | null
      expectedResult: string
      responseIndex: string
    }>
  >
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
  evaluationRunning: boolean
  criteria: CriteriaWithOptions | Criteria
  gridClasses: {
    [x: string]: boolean
  }
  instance: Instance
  setInstance: (instance: Instance) => void
  readOnly: boolean
  removeInstance: () => void
  type: EvaluationType
}

export const TestDataTableRow = ({
  explanationOn,
  setSelectedResultDetails,
  setResultDetailsModalOpen,
  evaluationRunning,
  criteria,
  expectedResultOn,
  gridClasses,
  readOnly,
  instance,
  setInstance,
  removeInstance,
  type,
}: Props) => {
  const responses = useMemo(() => {
    return returnByPipelineType(type, [(instance as DirectInstance).response], (instance as PairwiseInstance).responses)
  }, [instance, type])

  const setResponse = useCallback(
    (newValue: string, index: number) => {
      if (type === EvaluationType.DIRECT) {
        setInstance({
          ...instance,
          response: newValue,
        } as DirectInstance)
      } else {
        setInstance({
          ...instance,
          responses: [...responses.slice(0, index), newValue, ...responses.slice(index + 1)],
        } as PairwiseInstance)
      }
    },
    [instance, responses, setInstance, type],
  )

  const setContextVariableValue = useCallback(
    (newValue: string, index: number) => {
      setInstance({
        ...instance,
        contextVariables: [
          ...instance.contextVariables.slice(0, index),
          {
            name: instance.contextVariables[index].name,
            value: newValue,
          },
          ...instance.contextVariables.slice(index + 1),
        ],
      })
    },
    [instance, setInstance],
  )

  const expectedResultsOptions = useMemo(
    () =>
      returnByPipelineType(
        type,
        () => (criteria as CriteriaWithOptions).options.map((option) => option.name),
        () => responses.map((_, i) => `Response ${i + 1}`),
      ),
    [responses, criteria, type],
  )

  const result = useMemo<{ result: string; positionalBias: boolean; agreement: boolean } | null>(() => {
    if (type == EvaluationType.DIRECT) {
      const directInstance = instance as DirectInstance
      if (directInstance.result === null) return null
      return {
        result: directInstance.result.option,
        positionalBias: directInstance.result.positionalBias,
        agreement: directInstance.result.option === directInstance.expectedResult,
      }
    } else {
      const pairwiseInstance = instance as PairwiseInstance
      if (pairwiseInstance.result === null) return null
      const winnerIndex = Object.values(pairwiseInstance.result).findIndex((r) => r.ranking === 1)
      return {
        result: `Response ${winnerIndex + 1}`,
        positionalBias: false,
        agreement: `${winnerIndex}` === instance.expectedResult,
      }
    }
  }, [instance, type])
  //   const onResultBlockClick = (i: number) => {
  //     if (results !== null && results[i] !== undefined) {
  //       setSelectedResultDetails({
  //         result: results[i],
  //         expectedResult: expectedResults !== null ? expectedResults[i] : '',
  //         responseIndex: `${i + 1}`,
  //       })
  //       setResultDetailsModalOpen(true)
  //     }
  //   }
  //   const getResultToDisplay = (i: number) => {
  //     if (results !== null) {
  //       return results[i] ? (results[i] as DirectAssessmentResult).option : ''
  //     }
  //     return ''
  //   }

  //   const onRemoveResponse = (i: number) => {
  //     if (responses.length === 1) return
  //     setResponses(responses.filter((_, j) => i !== j))
  //     results !== null && setResults(results.filter((_, j) => i !== j) as UseCase['results'])
  //     expectedResults !== null && setExpectedResults(expectedResults.filter((_, j) => i !== j))
  //   }
  return (
    <>
      <RemovableSection onRemove={() => removeInstance()} readOnly={readOnly}>
        {({ setActive, setInactive }) => (
          <div
            className={cx(classes.tableRow, classes.responsesRow, {
              ...gridClasses,
            })}
          >
            {/* Response */}
            <div className={cx(classes.tableRowSection)}>
              {responses.map((response, i) => (
                <FlexTextArea
                  onChange={(e) => setResponse(e.target.value, i)}
                  value={response}
                  id="text-area-model-output"
                  labelText={''}
                  placeholder="The text to evaluate"
                  key={i}
                  onFocus={setActive}
                  onBlur={setInactive}
                  className={cx(classes.blockElement)}
                />
              ))}
              {instance.contextVariables.map((contextVariable, i) => (
                <FlexTextArea
                  value={contextVariable.value}
                  id="text-area-model-output"
                  onChange={(e) => setContextVariableValue(e.target.value, i)}
                  labelText={''}
                  placeholder="Context"
                  key={i}
                  onFocus={setActive}
                  onBlur={setInactive}
                  className={cx(classes.blockElement)}
                />
              ))}
            </div>
            {/* Expected result */}
            {expectedResultOn && (
              <div className={cx(classes.blockElement, classes.resultBlock)}>
                <Select
                  id={`select-expected-results`}
                  noLabel
                  value={
                    instance.expectedResult !== null && instance.expectedResult !== '' ? instance.expectedResult : ''
                  }
                  onChange={(e) =>
                    setInstance({
                      ...instance,
                      expectedResult: e.target.value,
                    })
                  }
                >
                  <SelectItem value={''} text={''} />
                  {expectedResultsOptions.map((option, i) => (
                    <SelectItem key={i} text={option} value={option} />
                  ))}
                </Select>
              </div>
            )}

            {result !== null && !evaluationRunning && (
              <>
                <div
                  className={cx(classes.blockElement, classes.resultBlock, {
                    // [classes.resultBlockPointerCursor]: results[i] !== undefined,
                    // [classes.resultBlockHover]: results[i] !== undefined,
                  })}
                  //   onClick={() => onResultBlockClick(i)}
                  tabIndex={-1}
                >
                  <div className={classes.resultBlockOuter}>
                    <div className={classes.resultBlockInner}>
                      <div
                        className={cx(classes.resultBlockTypography, {
                          [classes.untrastedResultTypography]: result.positionalBias || !result.agreement,
                        })}
                        onFocus={setActive}
                        onBlur={setInactive}
                      >
                        <strong>{result.result}</strong>
                      </div>
                      {result.positionalBias && (
                        <div className={cx(classes.positionalBias)}>{'Positional bias detected'}</div>
                      )}

                      {!result.agreement && (
                        <div
                          className={cx(classes.resultBlockTypography, {
                            [classes.untrastedResultTypography]: !result.agreement,
                            [classes.softText]: result.agreement,
                          })}
                        >{`Agreement: ${result.agreement ? 'Yes' : 'No'}`}</div>
                      )}
                    </div>
                    <Link style={{ alignSelf: 'flex-end' }} className={classes.resultDetailsAction}>
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Explanation */}
                {type === EvaluationType.DIRECT && explanationOn && (
                  <FlexTextArea
                    readOnly
                    value={(instance as DirectInstance).result?.summary || undefined}
                    labelText={''}
                    placeholder=""
                    // key={`rubric_${i}`}
                    // id={`rubric_${i}_3`}
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
    </>
  )
}
