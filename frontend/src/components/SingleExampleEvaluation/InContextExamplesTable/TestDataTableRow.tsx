import cx from 'classnames'
import { returnByPipelineType, toTitleCase } from 'src/utils'

import { useCallback, useMemo } from 'react'

import { Select, SelectItem } from '@carbon/react'
import { TrashCan, Undo } from '@carbon/react/icons'

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
} from '../../../types'
import RemovableSection from '../../RemovableSection/RemovableSection'
import classes from './index.module.scss'

interface Props {
  instance: Instance
  setInstance: (instance: Instance) => void
  removeInstance: () => void
  type: EvaluationType
  criteria: CriteriaWithOptions | Criteria
  convertInstanceToTestData: () => void
}

export const TestDataTableRow = ({
  instance,
  setInstance,
  removeInstance,
  type,
  criteria,
  convertInstanceToTestData,
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

  const rowActions = useMemo(() => {
    const actions = [
      {
        label: 'Move to test data',
        fn: convertInstanceToTestData,
        icon: Undo,
        enabled: true,
      },
      {
        label: 'Remove',
        fn: () => removeInstance(),
        icon: TrashCan,
        enabled: true,
      },
    ]
    return actions
  }, [convertInstanceToTestData, removeInstance])

  return (
    <>
      <RemovableSection actions={rowActions}>
        {({ setActive, setInactive }) => (
          <div className={cx(classes.tableRow, classes.responsesRow, classes.columns2)}>
            {/* Response */}
            <div className={cx(classes.tableRowSection)}>
              {responses.map((response, i) => (
                <div key={i} style={{ position: 'relative', height: '100%' }}>
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
              <Select
                id={`select-expected-results`}
                noLabel
                value={
                  instance.expectedResult !== null && instance.expectedResult !== '' ? instance.expectedResult : ''
                }
                readOnly
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
          </div>
        )}
      </RemovableSection>
    </>
  )
}
