import cx from 'classnames'
import { generateId, returnByPipelineType, toTitleCase } from 'src/utils'

import { Dispatch, SetStateAction, useCallback, useMemo } from 'react'

import { InlineLoading, Link, Select, SelectItem, Tooltip } from '@carbon/react'
import { ArrowRight, Maximize, Play, Replicate, Tools, TrashCan, Trophy } from '@carbon/react/icons'

import { FlexTextArea } from '@components/FlexTextArea/FlexTextArea'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'

import {
  Criteria,
  CriteriaWithOptions,
  DirectInstance,
  DirectInstanceResult,
  EvaluationType,
  Instance,
  PairwiseInstance,
  PairwiseInstanceResult,
} from '../../../types'
import RemovableSection from '../../RemovableSection/RemovableSection'
import classes from './index.module.scss'

interface Props {
  setSelectedInstance: Dispatch<SetStateAction<Instance | null>>
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
  evaluationRunning: boolean
  isInstanceEvaluationRunning: boolean
  criteria: CriteriaWithOptions | Criteria
  gridClasses: {
    [x: string]: boolean
  }
  instance: Instance
  setInstance: (instance: Instance) => void
  removeInstance: () => void
  type: EvaluationType
  addInstance: (instance: Instance, index?: number) => void
  resultsAvailable: boolean
  runEvaluation: (evaluationIds: string[]) => Promise<void>
  convertInstanceToExample: () => void
  index: number
}

export const TestDataTableRow = ({
  setSelectedInstance,
  setResultDetailsModalOpen,
  evaluationRunning,
  isInstanceEvaluationRunning,
  criteria,
  gridClasses,
  instance,
  setInstance,
  addInstance,
  removeInstance,
  type,
  resultsAvailable,
  runEvaluation,
  convertInstanceToExample,
  index,
}: Props) => {
  const { outdatedResultInstanceIds, setInstancesLastEvaluatedContent, getStringifiedInstanceContent } =
    useCurrentTestCase()
  const { fixInstance } = useTestCaseActionsContext()
  const isResultOutdated = useMemo(
    () => outdatedResultInstanceIds.includes(instance.id),
    [instance.id, outdatedResultInstanceIds],
  )

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

        () => [
          ...responses.map((_, i) => ({ text: `${toTitleCase(criteria.predictionField)} ${i + 1}`, value: i })),
          { text: 'Tie', value: 'tie' },
        ],
      ).filter((option) => option.text !== ''),
    [type, criteria, responses],
  )

  const positionalBiasDetected = useMemo(() => {
    if (instance.result === null) return false
    return instance.result.positionalBias ? instance.result.positionalBias.detected : false
  }, [instance])

  const pairwiseWinnerIndexOrTie = useMemo(() => {
    if (instance.result === null || type !== EvaluationType.PAIRWISE) return null
    return (instance.result as PairwiseInstanceResult).selectedOption
  }, [instance.result, type])

  const result = useMemo<{ result: string; positionalBias: boolean; agreement: boolean } | null>(() => {
    if (type == EvaluationType.DIRECT) {
      const directInstance = instance as DirectInstance
      const result = directInstance.result as DirectInstanceResult
      if (!result) return null
      return {
        result: (result as DirectInstanceResult).selectedOption,
        positionalBias: positionalBiasDetected,
        agreement: result.selectedOption === directInstance.expectedResult,
      }
    } else {
      const pairwiseInstance = instance as PairwiseInstance
      if (pairwiseInstance.result === null || pairwiseWinnerIndexOrTie === null) return null
      const winner = pairwiseWinnerIndexOrTie === 'tie' ? 'Tie' : `Response ${Number(pairwiseWinnerIndexOrTie) + 1}`
      return {
        result: winner,
        positionalBias: positionalBiasDetected,
        agreement: pairwiseWinnerIndexOrTie == instance.expectedResult,
      }
    }
  }, [instance, pairwiseWinnerIndexOrTie, positionalBiasDetected, type])

  const onExpandInstance = useCallback(() => {
    setSelectedInstance(instance)
    setResultDetailsModalOpen(true)
  }, [instance, setResultDetailsModalOpen, setSelectedInstance])

  const onDuplicateInstance = useCallback(() => {
    const id = generateId()
    const duplicatedInstance = { ...instance, id }
    addInstance(duplicatedInstance, index + 1)
    setInstancesLastEvaluatedContent((prev) =>
      Object.fromEntries([...Object.entries(prev), [id, getStringifiedInstanceContent(duplicatedInstance)]]),
    )
  }, [addInstance, getStringifiedInstanceContent, index, instance, setInstancesLastEvaluatedContent])

  const rowActions = useMemo(() => {
    const actions = [
      {
        label: 'Evaluate',
        fn: () => {
          runEvaluation([instance.id])
        },
        icon: Play,
        enabled: true,
      },
      {
        label: 'See details',
        fn: onExpandInstance,
        icon: Maximize,
        enabled: true,
      },
      {
        label: 'Duplicate',
        fn: onDuplicateInstance,
        icon: Replicate,
        enabled: true,
      },
      {
        label: 'Remove',
        fn: removeInstance,
        icon: TrashCan,
        enabled: true,
      },
    ]
    if (type == EvaluationType.DIRECT && (instance.result as DirectInstanceResult)?.feedback) {
      actions.push({
        label: 'Fix instance',
        fn: () => fixInstance(instance.id),
        icon: Tools,
        enabled: true,
      })
    }
    return actions
  }, [
    fixInstance,
    instance.id,
    instance.result,
    onDuplicateInstance,
    onExpandInstance,
    removeInstance,
    runEvaluation,
    type,
  ])

  return (
    <>
      <RemovableSection actions={rowActions}>
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
                  {!evaluationRunning && i === pairwiseWinnerIndexOrTie && (
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
                    instanceId={instance.id}
                    fieldName={criteria.predictionField}
                  />
                </div>
              ))}
              {instance.contextVariables.map((contextVariable, i) => (
                <FlexTextArea
                  value={contextVariable.value}
                  id="text-area-model-output"
                  onChange={(e) => setContextVariableValue(e.target.value, i)}
                  labelText={''}
                  placeholder={contextVariable.name ? `The ${contextVariable.name}` : 'Context'}
                  key={i}
                  onFocus={setActive}
                  onBlur={setInactive}
                  className={cx(classes.blockElement)}
                  instanceId={instance.id}
                  fieldName={contextVariable.name}
                />
              ))}
            </div>
            {/* Expected result */}
            <div className={cx(classes.blockElement, classes.resultBlock)}>
              <div className={classes.resultBlockOuter}>
                <div className={classes.resultBlockInner}>
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
                    style={{ flex: '0 0 auto !important', height: '40px !important', lineHeight: '40px !important' }}
                  >
                    <SelectItem value={''} text={''} />
                    {expectedResultsOptions.map((option, i) => (
                      <SelectItem key={i} text={option.text} value={option.value} />
                    ))}
                  </Select>
                  {instance.expectedResult != '' && (
                    <Link
                      onClick={() => convertInstanceToExample()}
                      renderIcon={() => <ArrowRight />}
                      className={classes.viewExplanation}
                    >
                      {'Convert to example'}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {result !== null && !isInstanceEvaluationRunning ? (
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
                      {instance.expectedResult !== '' && (
                        <div
                          className={cx(classes.resultBlockTypography, {
                            [classes.untrastedResultTypography]: !result.agreement,
                            [classes.softText]: result.agreement,
                          })}
                        >{`Agreement: ${result.agreement ? 'Yes' : 'No'}`}</div>
                      )}
                      {isResultOutdated && (
                        <div className={cx(classes.resultBlockTypography, classes.softText)}>
                          {'This result is outdated!'}
                        </div>
                      )}
                      <Link
                        onClick={onExpandInstance}
                        renderIcon={() => <ArrowRight />}
                        className={classes.viewExplanation}
                      >
                        {'View explanation'}
                      </Link>
                    </div>
                  </div>
                </div>
              </>
            ) : resultsAvailable || evaluationRunning ? (
              <div className={cx(classes.blockElement, classes.resultBlock)} tabIndex={-1}>
                {evaluationRunning && isInstanceEvaluationRunning && (
                  <div className={classes.inlineLoadingContainer}>
                    <InlineLoading
                      style={{ inlineSize: 'unset' }}
                      description={''}
                      status={'active'}
                      className={classes.loadingWrapper}
                    />
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </RemovableSection>
    </>
  )
}
