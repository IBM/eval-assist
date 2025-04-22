import cx from 'classnames'
import { returnByPipelineType } from 'src/utils'

import { CSSProperties, ChangeEvent, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'

import { Button, IconButton, InlineLoading, PaginationNav, Toggle } from '@carbon/react'
import { Add, AiGenerate, Save, SettingsAdjust, TrashCan } from '@carbon/react/icons'

import { EditableTag } from '@components/EditableTag'
import { INSTANCES_PER_PAGE } from '@constants'
import { usePagination } from '@customHooks/usePagination'

import {
  Criteria,
  CriteriaWithOptions,
  DirectInstance,
  DirectInstanceResult,
  EvaluationType,
  Evaluator,
  Instance,
  PairwiseInstance,
  PairwiseInstanceResultV1,
  UseCase,
} from '../../../types'
import { useToastContext } from '../Providers/ToastProvider'
import { useURLParamsContext } from '../Providers/URLParamsProvider'
import { TestDataTableRow } from './TestDataTableRow'
import classes from './index.module.scss'

interface Props {
  style?: CSSProperties
  className?: string
  type: EvaluationType
  evaluationRunning: boolean
  setSelectedInstance: Dispatch<SetStateAction<Instance | null>>
  setResultDetailsModalOpen: Dispatch<SetStateAction<boolean>>
  criteria: CriteriaWithOptions | Criteria
  responseVariableName: string
  setResponseVariableName: (newValue: string) => void
  currentTestCase: UseCase
  setInstances: (instances: Instance[]) => void
  loadingSyntheticExamples: boolean
  setSysntheticGenerationModalOpen: Dispatch<SetStateAction<boolean>>
  generateTestData: () => Promise<void>
  modelForSyntheticGeneration: Evaluator | null
}

export const TestDataTable = ({
  style,
  className,
  setInstances,
  type,
  evaluationRunning,
  setSelectedInstance,
  setResultDetailsModalOpen,
  criteria,
  responseVariableName,
  setResponseVariableName,
  loadingSyntheticExamples,
  setSysntheticGenerationModalOpen,
  currentTestCase,
  generateTestData,
  modelForSyntheticGeneration,
}: Props) => {
  const instancesPerPage = useMemo(() => INSTANCES_PER_PAGE, [])
  const [explanationOn, setExplanationOn] = useState(false)
  const instances = useMemo(() => currentTestCase.instances, [currentTestCase.instances])
  const { currentInstances, currentPage, goToPage, totalPages, goToLastPage } = usePagination({
    instances,
    instancesPerPage: instancesPerPage,
  })

  const [expectedResultOn, setExpectedResultOn] = useState(true)

  const { isRisksAndHarms, syntheticGenerationEnabled } = useURLParamsContext()

  const resultsAvailable = useMemo(
    () => instances.some((instance) => (instance as DirectInstance | PairwiseInstance).result !== null),
    [instances],
  )

  const directGridClasses = useMemo(
    () => ({
      [classes.columns1]: !expectedResultOn && (!resultsAvailable || evaluationRunning),
      [classes.columns2]:
        (!explanationOn && resultsAvailable && !expectedResultOn && !evaluationRunning) ||
        (expectedResultOn && !resultsAvailable) ||
        (expectedResultOn && evaluationRunning),
      [classes.columns3var1]: expectedResultOn && resultsAvailable && !evaluationRunning && !explanationOn,
      [classes.columns3var2]: !expectedResultOn && resultsAvailable && !evaluationRunning && explanationOn,
      [classes.columns4]: expectedResultOn && resultsAvailable && !evaluationRunning && explanationOn,
    }),
    [evaluationRunning, expectedResultOn, explanationOn, resultsAvailable],
  )

  const headerDirectGridClasses = useMemo(
    () => ({
      [classes.columns1]: !expectedResultOn && (!resultsAvailable || evaluationRunning),
      [classes.columns2]:
        (!explanationOn && resultsAvailable && !expectedResultOn && !evaluationRunning) ||
        (expectedResultOn && !resultsAvailable) ||
        (expectedResultOn && evaluationRunning),
      [classes.columns3var1]: expectedResultOn && resultsAvailable && !evaluationRunning && !explanationOn,
      [classes.columns3var5]: !expectedResultOn && resultsAvailable && !evaluationRunning && explanationOn,
      [classes.columns3var4]: expectedResultOn && resultsAvailable && !evaluationRunning && explanationOn,
    }),
    [evaluationRunning, expectedResultOn, explanationOn, resultsAvailable],
  )

  const pairwiseGridClasses = useMemo(
    () => ({
      [classes.columns1]: !expectedResultOn && (!resultsAvailable || evaluationRunning),
      [classes.columns2]:
        (resultsAvailable && !expectedResultOn && !evaluationRunning) ||
        (expectedResultOn && !resultsAvailable) ||
        (expectedResultOn && evaluationRunning),
      [classes.columns3var3]: expectedResultOn && resultsAvailable && !evaluationRunning,
    }),
    [evaluationRunning, expectedResultOn, resultsAvailable],
  )

  const noPositionalBias = useMemo(() => {
    if (!resultsAvailable) return
    return type === EvaluationType.DIRECT
      ? (instances as DirectInstance[])?.every(
          (instance) => (instance.result as DirectInstanceResult)?.positionalBias.detected == false,
        )
      : (instances as PairwiseInstance[])?.every(
          (instance) =>
            instance.result === null ||
            Object.values(instance.result as PairwiseInstanceResultV1).every((perResponseResults) =>
              perResponseResults.positionalBias.every((pBias) => pBias === false),
            ),
        )
  }, [instances, resultsAvailable, type])

  const addEmptyRow = () => {
    let newEmptyInstance: Instance = {
      contextVariables: instances[0].contextVariables.map((contextVariable) => ({
        name: contextVariable.name,
        value: '',
      })),
      expectedResult: '',
      result: null,
    }
    if (type === EvaluationType.DIRECT) {
      ;(newEmptyInstance as DirectInstance) = { ...newEmptyInstance, response: '' }
    } else {
      ;(newEmptyInstance as PairwiseInstance) = {
        ...newEmptyInstance,
        responses: (instances[0] as PairwiseInstance).responses.map((_) => ''),
      }
    }
    setInstances([...instances, newEmptyInstance])
  }

  const addInstance = (instance: Instance) => {
    setInstances([...instances, instance])
  }

  const addContextVariable = () => {
    setInstances(
      instances.map((instance) => {
        return { ...instance, contextVariables: [...instance.contextVariables, { name: '', value: '' }] }
      }),
    )
  }

  const addResponse = () => {
    setInstances(
      (instances as PairwiseInstance[]).map((instance) => {
        return { ...instance, responses: [...instance.responses, ''] }
      }),
    )
  }

  const editContextVariable = (newValue: string, index: number) => {
    const actualIndex = getActualInstanceIndex(index)
    setInstances(
      instances.map((instance) => {
        return {
          ...instance,
          contextVariables: [
            ...instance.contextVariables.slice(0, actualIndex),
            {
              name: newValue,
              value: instance.contextVariables[actualIndex].value,
            },
            ...instance.contextVariables.slice(actualIndex + 1),
          ],
        }
      }),
    )
  }

  const removeContextVariable = useCallback(
    (indexToDelete: number) => {
      setInstances([
        ...instances.map((instance) => ({
          ...instance,
          contextVariables: instance.contextVariables.filter((_, i) => i !== indexToDelete),
        })),
      ])
    },
    [instances, setInstances],
  )

  const removePairwiseResponse = useCallback(
    (responseIndex: number) => {
      setInstances([
        ...instances.map((instance) => ({
          ...instance,
          responses: (instance as PairwiseInstance).responses.filter((_, i) => i !== responseIndex),
        })),
      ])
    },
    [instances, setInstances],
  )

  const getActualInstanceIndex = useCallback(
    (index: number) => {
      return currentPage * instancesPerPage + index
    },
    [currentPage, instancesPerPage],
  )

  const removeInstance = useCallback(
    (indexToRemove: number) => {
      setInstances(instances.filter((_, i) => getActualInstanceIndex(indexToRemove) !== i))
    },
    [getActualInstanceIndex, instances, setInstances],
  )

  const onPageChange = useCallback(
    (pageIndex: number) => {
      goToPage(pageIndex)
    },
    [goToPage],
  )

  const setInstance = useCallback(
    (instance: Instance, index: number) => {
      const actualIndex = getActualInstanceIndex(index)
      setInstances([...instances.slice(0, actualIndex), instance, ...instances.slice(actualIndex + 1)])
    },
    [getActualInstanceIndex, instances, setInstances],
  )

  useEffect(() => {
    goToLastPage()
  }, [goToLastPage, instances.length])

  return (
    <div style={style} className={className}>
      <div className={classes.content}>
        <div className={cx(classes.innerContainer)}>
          <div
            className={cx(classes.tableRow, classes.headerRow, {
              ...returnByPipelineType(type, headerDirectGridClasses, pairwiseGridClasses),
            })}
          >
            <div className={cx(classes.blockElement, classes.headerBlock, classes.headerResponseBlock)}>
              <strong className={cx(classes.headerTypography)}>{'Test data'}</strong>
              {type === EvaluationType.PAIRWISE && (
                <Button kind="ghost" size="sm" renderIcon={Add} onClick={addResponse}>
                  {'Add response'}
                </Button>
              )}
              <Button kind="ghost" size="sm" renderIcon={Add} onClick={addContextVariable}>
                {'Add variable'}
              </Button>
            </div>
            {expectedResultOn && (
              <div className={cx(classes.blockElement, classes.headerBlock)}>
                <strong className={cx(classes.headerTypography)}>
                  {returnByPipelineType(type, 'Expected result', 'Expected winner')}
                </strong>
              </div>
            )}
            {resultsAvailable && !evaluationRunning && (
              <div className={cx(classes.blockElement, classes.headerBlock)}>
                <strong className={classes.headerTypography}>
                  {returnByPipelineType(type, 'Generated result', 'Generated winner')}
                </strong>
              </div>
            )}
          </div>
          <div
            className={cx(classes.tableRow, classes.subHeaderRow, {
              ...returnByPipelineType(type, directGridClasses, pairwiseGridClasses),
            })}
          >
            <div className={cx(classes.tableRowSection)}>
              {returnByPipelineType<string[], string[]>(type, [responseVariableName], () =>
                (instances[0] as PairwiseInstance).responses.map((_, i) => `Response ${i + 1}`),
              ).map((reponseName, i) => (
                <div key={i} className={cx(classes.blockElement, classes.subHeaderBlock)}>
                  <EditableTag
                    value={reponseName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setResponseVariableName(e.target.value)}
                    color="blue"
                    isEditable={type === EvaluationType.DIRECT}
                  />
                  {type == EvaluationType.PAIRWISE && (instances[0] as PairwiseInstance).responses.length > 2 && (
                    <IconButton kind={'ghost'} label={'Remove'} onClick={() => removePairwiseResponse(i)}>
                      <TrashCan />
                    </IconButton>
                  )}
                </div>
              ))}
              {instances[0].contextVariables.map((contextVariable, i) => (
                <div key={i} className={cx(classes.blockElement, classes.subHeaderBlock)}>
                  <EditableTag
                    value={contextVariable.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => editContextVariable(e.target.value, i)}
                    color="purple"
                  />
                  <IconButton kind={'ghost'} label={'Remove'} onClick={() => removeContextVariable(i)}>
                    <TrashCan />
                  </IconButton>
                </div>
              ))}
            </div>
            {expectedResultOn && (
              <div className={cx(classes.blockElement, classes.subHeaderBlock)}>
                {/* <strong className={cx(classes.headerTypography)}>
                  {returnByPipelineType(type, 'Expected result', 'Expected ranking')}
                </strong> */}
              </div>
            )}
            {resultsAvailable && !evaluationRunning && (
              <div className={cx(classes.blockElement, classes.subHeaderBlock)}></div>
            )}
            {resultsAvailable && !evaluationRunning && explanationOn && type === EvaluationType.DIRECT && (
              <div className={cx(classes.blockElement, classes.subHeaderBlock)}>
                <strong className={cx(classes.headerTypography)}>{'Explanation'}</strong>
              </div>
            )}
          </div>
          {currentInstances.map((instance, i) => (
            <TestDataTableRow
              key={i}
              explanationOn={explanationOn}
              expectedResultOn={expectedResultOn}
              setSelectedInstance={setSelectedInstance}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              evaluationRunning={evaluationRunning}
              criteria={criteria}
              gridClasses={returnByPipelineType(type, directGridClasses, pairwiseGridClasses)}
              instance={instance}
              setInstance={(instance) => setInstance(instance, i)}
              readOnly={instances.length === 1 || evaluationRunning}
              removeInstance={() => removeInstance(i)}
              type={type}
              addInstance={addInstance}
              resultsAvailable={resultsAvailable}
              responseVariableName={responseVariableName}
            />
          ))}
          {totalPages > 1 && (
            <div className={cx(classes.tableRow)}>
              <div className={cx(classes.blockElement, classes.paginationBlock)}>
                <PaginationNav
                  itemsShown={currentInstances.length}
                  page={currentPage}
                  size="lg"
                  totalItems={totalPages}
                  onChange={onPageChange}
                  aria-disabled={totalPages == 1}
                />
              </div>
            </div>
          )}
          <div className={cx(classes.paginationRow, classes.actionButtonsRow)}>
            <div className={cx(classes.actionButton)}>
              <Button kind="tertiary" size="sm" renderIcon={Add} onClick={addEmptyRow}>
                {'Add row'}
              </Button>
            </div>
            <div className={cx(classes.actionButton)}>
              {loadingSyntheticExamples ? (
                <InlineLoading description={'Generating...'} status={'active'} />
              ) : syntheticGenerationEnabled ? (
                <div className={classes.syntheticButtons}>
                  <Button
                    kind="tertiary"
                    size="sm"
                    renderIcon={AiGenerate}
                    onClick={() =>
                      modelForSyntheticGeneration === null ? setSysntheticGenerationModalOpen(true) : generateTestData()
                    }
                    disabled={type == EvaluationType.PAIRWISE}
                  >
                    {'Generate test data'}
                  </Button>
                  <IconButton
                    kind={'tertiary'}
                    label={'Configure'}
                    size="sm"
                    onClick={() => setSysntheticGenerationModalOpen(true)}
                    disabled={type == EvaluationType.PAIRWISE}
                  >
                    <SettingsAdjust />
                  </IconButton>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      {!evaluationRunning && resultsAvailable && noPositionalBias ? (
        <p style={{ marginTop: '0.5rem' }} className={classes.softText}>
          {'No positional bias was detected in any of the instances.'}
        </p>
      ) : null}
      <div className={classes.toggles}>
        <Toggle
          labelText={'Show expected result'}
          toggled={expectedResultOn}
          onToggle={() => setExpectedResultOn(!expectedResultOn)}
          size="sm"
          hideLabel
          id="toggle-expected-result"
          className={classes.toggle}
        />
        {/* {resultsAvailable && !evaluationRunning && type === EvaluationType.DIRECT && (
          <Toggle
            labelText={'Show Explanation'}
            toggled={explanationOn}
            onToggle={() => setExplanationOn(!explanationOn)}
            size="sm"
            hideLabel
            id="toggle-explanation"
            className={classes.toggle}
          />
        )} */}
      </div>
    </div>
  )
}
