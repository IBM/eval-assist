import cx from 'classnames'
import { returnByPipelineType, toTitleCase } from 'src/utils'

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { Link, Select, SelectItem, Tooltip } from '@carbon/react'
import { Trophy } from '@carbon/react/icons'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'

import {
  Criteria,
  CriteriaWithOptions,
  DirectInstance,
  DirectInstanceResult,
  EvaluationType,
  Instance,
  PairwiseInstance,
  PairwiseInstanceResult,
  PerResponsePairwiseResult,
} from '../../../types'
import RemovableSection from '../../RemovableSection/RemovableSection'
import classes from './index.module.scss'

interface Props {
  explanationOn: boolean
  expectedResultOn: boolean
  setSelectedInstance: Dispatch<SetStateAction<Instance | null>>
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
  addInstance: (instance: Instance) => void
  resultsAvailable: boolean
  responseVariableName: string
}

export const TestDataTableRow = ({
  explanationOn,
  setSelectedInstance,
  setResultDetailsModalOpen,
  evaluationRunning,
  criteria,
  expectedResultOn,
  gridClasses,
  readOnly,
  instance,
  setInstance,
  addInstance,
  removeInstance,
  responseVariableName,
  type,
  resultsAvailable,
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
        () => (criteria as CriteriaWithOptions).options.map((option) => ({ value: option.name, text: option.name })),

        () => responses.map((_, i) => ({ text: `${toTitleCase(responseVariableName)} ${i + 1}`, value: i + 1 })),
      ).filter((option) => option.text !== ''),
    [type, criteria, responses, responseVariableName],
  )

  const result = useMemo<{ result: string; positionalBias: boolean; agreement: boolean } | null>(() => {
    if (type == EvaluationType.DIRECT) {
      const directInstance = instance as DirectInstance
      const result = directInstance.result as DirectInstanceResult
      if (!result) return null
      return {
        result: (result as DirectInstanceResult).option,
        positionalBias: result.positionalBias.detected,
        agreement: result.option === directInstance.expectedResult,
      }
    } else {
      const pairwiseInstance = instance as PairwiseInstance
      if (pairwiseInstance.result === null) return null
      const winnerIndex = Object.values(pairwiseInstance.result).findIndex((r) => r.ranking === 1)
      const winner = `Response ${winnerIndex + 1}`
      return {
        result: winner,
        positionalBias: false,
        agreement: `${winnerIndex + 1}` === instance.expectedResult,
      }
    }
  }, [instance, type])

  const onExpandInstance = () => {
    setSelectedInstance(instance)
    setResultDetailsModalOpen(true)
  }

  const onDuplicateInstance = () => {
    addInstance({ ...instance })
  }

  const pairwiseWinnerIndex = useMemo(() => {
    if (instance.result === null || type !== EvaluationType.PAIRWISE) return null
    return Object.values(instance.result as PairwiseInstanceResult)
      .map((r) => r.ranking)
      .indexOf(1)
  }, [instance.result, type])

  return (
    <>
      <RemovableSection
        onRemove={() => removeInstance()}
        onExpand={() => onExpandInstance()}
        onDuplicate={() => onDuplicateInstance()}
        removeEnabled={!readOnly}
      >
        {({ setActive, setInactive }) => (
          <div
            className={cx(classes.tableRow, classes.responsesRow, {
              ...gridClasses,
            })}
          >
            {/* Response */}
            <div className={cx(classes.tableRowSection)}>
              {responses.map((response, i) => (
                <div key={i} style={{ position: 'relative', height: '100%' }}>
                  {!evaluationRunning && i === pairwiseWinnerIndex && (
                    <Tooltip
                      label={'Winner'}
                      style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        zIndex: 4,
                      }}
                    >
                      <div
                        style={{
                          opacity: '0.5',
                        }}
                      >
                        <Trophy />
                      </div>
                    </Tooltip>
                  )}

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
                </div>
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
                    <SelectItem key={i} text={option.text} value={option.value} />
                  ))}
                </Select>
              </div>
            )}

            {result !== null && !evaluationRunning ? (
              <>
                <div className={cx(classes.blockElement, classes.resultBlock)} tabIndex={-1}>
                  <div className={classes.resultBlockOuter}>
                    <div className={classes.resultBlockInner}>
                      <div
                        className={cx(classes.resultBlockTypography, {
                          [classes.untrastedResultTypography]:
                            instance.expectedResult && (result.positionalBias || !result.agreement),
                        })}
                        onFocus={setActive}
                        onBlur={setInactive}
                      >
                        <strong>{result.result}</strong>
                      </div>
                      {result.positionalBias && (
                        <div className={cx(classes.positionalBias)}>{'Positional bias detected'}</div>
                      )}

                      {instance.expectedResult && (
                        <div
                          className={cx(classes.resultBlockTypography, {
                            [classes.untrastedResultTypography]: !result.agreement,
                            [classes.softText]: result.agreement,
                          })}
                        >{`Agreement: ${result.agreement ? 'Yes' : 'No'}`}</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                {type === EvaluationType.DIRECT && explanationOn && (
                  <FlexTextArea
                    readOnly
                    value={(instance.result as DirectInstanceResult)?.explanation || undefined}
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
            ) : resultsAvailable ? (
              <>
                <div className={cx(classes.blockElement, classes.resultBlock)} tabIndex={-1} />
                {type === EvaluationType.DIRECT && explanationOn && (
                  <div
                    className={cx(classes.blockElement, classes.resultBlockDefaultCursor, classes.explanationBlock)}
                  />
                )}
              </>
            ) : null}
          </div>
        )}
      </RemovableSection>
    </>
  )
}
