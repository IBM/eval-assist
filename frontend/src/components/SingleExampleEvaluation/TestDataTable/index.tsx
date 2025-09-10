import cx from 'classnames'
import { generateId, returnByPipelineType, toTitleCase } from 'src/utils'

import { CSSProperties, ChangeEvent, Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react'

import { Button, IconButton, InlineLoading, PaginationNav, Toggle } from '@carbon/react'
import { Add, AiGenerate, Download, Save, SettingsAdjust, TrashCan } from '@carbon/react/icons'

import { EditableTag } from '@components/EditableTag'
import { INSTANCES_PER_PAGE } from '@constants'
import { usePagination } from '@customHooks/usePagination'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'
import { useModalsContext } from '@providers/ModalsProvider'
import { useSyntheticGeneration } from '@providers/SyntheticGenerationProvider'
import { useTestCaseActionsContext } from '@providers/TestCaseActionsProvider'
import { useURLParamsContext } from '@providers/URLParamsProvider'

import {
  DirectInstance,
  DirectInstanceResult,
  EvaluationType,
  Instance,
  PairwiseInstance,
  PairwiseInstanceResult,
} from '../../../types'
import { TestDataTableRow } from './TestDataTableRow'
import classes from './index.module.scss'

interface Props {
  style?: CSSProperties
  className?: string
}

export const TestDataTable = ({ style, className }: Props) => {
  const { currentTestCase, setCurrentTestCase, setSelectedInstance } = useCurrentTestCase()
  const { evaluationRunning, evaluatingInstanceIds } = useTestCaseActionsContext()
  const {
    setResultDetailsModalOpen,
    setSyntheticGenerationModalOpen,
    setEditPairwiseResponseNameModalOpen,
    setImportTestDataModalOpen,
  } = useModalsContext()
  const { loadingSyntheticExamples } = useSyntheticGeneration()
  const instancesPerPage = useMemo(() => INSTANCES_PER_PAGE, [])
  const instances = useMemo(() => currentTestCase.instances, [currentTestCase.instances])
  const { generateTestData, hasGeneratedSyntheticMap } = useSyntheticGeneration()
  const { runEvaluation } = useTestCaseActionsContext()
  const { currentInstances, currentPage, goToPage, totalPages, goToLastPage } = usePagination({
    instances,
    instancesPerPage: instancesPerPage,
  })

  const setInstances = useCallback(
    (instances: Instance[]) => {
      setCurrentTestCase({ ...currentTestCase, instances })
    },
    [currentTestCase, setCurrentTestCase],
  )

  const { syntheticGenerationEnabled } = useURLParamsContext()

  const resultsAvailable = useMemo(
    () => instances.some((instance) => (instance as DirectInstance | PairwiseInstance).result !== null),
    [instances],
  )

  const gridClasses = useMemo(
    () => ({
      [classes.columns2]: !resultsAvailable && !evaluationRunning,
      [classes.columns3]: resultsAvailable || evaluationRunning,
    }),
    [evaluationRunning, resultsAvailable],
  )

  const noPositionalBias = useMemo(() => {
    if (!resultsAvailable) return
    return currentTestCase.type === EvaluationType.DIRECT
      ? (instances as DirectInstance[])?.every(
          (instance) => (instance.result as DirectInstanceResult)?.positionalBias?.detected == false,
        )
      : (instances as PairwiseInstance[])?.every(
          (instance) =>
            instance.result === null ||
            Object.values(instance.result as PairwiseInstanceResult).every((perResponseResults) =>
              perResponseResults.positionalBias.every((pBias) => pBias === false),
            ),
        )
  }, [currentTestCase.type, instances, resultsAvailable])

  const addEmptyRow = () => {
    let newEmptyInstance: Instance = {
      contextVariables: currentTestCase.criteria.contextFields.map((contextVariableName) => ({
        name: contextVariableName,
        value: '',
      })),
      expectedResult: '',
      result: null,
      id: generateId(),
    }
    if (currentTestCase.type === EvaluationType.DIRECT) {
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
    setCurrentTestCase({
      ...currentTestCase,
      instances: instances.map((instance) => ({
        ...instance,
        contextVariables: [...instance.contextVariables, { name: '', value: '' }],
      })),
      criteria: {
        ...currentTestCase.criteria,
        contextFields: [...currentTestCase.criteria.contextFields, ''],
      },
    })
  }

  const addResponse = () => {
    setInstances(
      (instances as PairwiseInstance[]).map((instance) => {
        return { ...instance, responses: [...instance.responses, ''] }
      }),
    )
  }

  const editContextVariable = (newValue: string, index: number) => {
    setCurrentTestCase({
      ...currentTestCase,
      instances: instances.map((instance) => ({
        ...instance,
        contextVariables: [
          ...instance.contextVariables.slice(0, index),
          {
            name: newValue,
            value: instance.contextVariables[index].value,
          },
          ...instance.contextVariables.slice(index + 1),
        ],
      })),
      criteria: {
        ...currentTestCase.criteria,
        contextFields: [
          ...currentTestCase.criteria.contextFields.slice(0, index),
          newValue,
          ...currentTestCase.criteria.contextFields.slice(index + 1),
        ],
      },
    })
  }

  const removeContextVariable = useCallback(
    (indexToDelete: number) => {
      const updatedInstances = instances.map((instance) => ({
        ...instance,
        contextVariables: instance.contextVariables.filter((_, i) => i !== indexToDelete),
      }))

      setCurrentTestCase({
        ...currentTestCase,
        criteria: {
          ...currentTestCase.criteria,
          contextFields: currentTestCase.criteria.contextFields.filter((_, i) => i !== indexToDelete),
        },
        instances: updatedInstances,
      })
    },
    [currentTestCase, instances, setCurrentTestCase],
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

  const responseNames = useMemo(
    () =>
      returnByPipelineType<string[], string[]>(
        currentTestCase.type,
        () => [currentTestCase.criteria.predictionField],
        () =>
          instances.length
            ? (instances[0] as PairwiseInstance).responses.map(
                (_, i) => `${currentTestCase.criteria.predictionField} ${i + 1}`,
              )
            : [],
      ),
    [currentTestCase.criteria.predictionField, currentTestCase.type, instances],
  )

  const onGenerateSyntheticDataClick = useCallback(() => {
    if (
      currentTestCase.syntheticGenerationConfig.evaluator === null ||
      !!!hasGeneratedSyntheticMap[currentTestCase.name]
    ) {
      setSyntheticGenerationModalOpen(true)
    } else {
      generateTestData()
    }
  }, [
    currentTestCase.name,
    currentTestCase.syntheticGenerationConfig.evaluator,
    generateTestData,
    hasGeneratedSyntheticMap,
    setSyntheticGenerationModalOpen,
  ])

  return (
    <div style={style} className={className}>
      <div className={classes.content}>
        <div className={cx(classes.innerContainer)}>
          <div className={cx(classes.tableRow, classes.headerRow, gridClasses)}>
            <div className={cx(classes.blockElement, classes.headerBlock, classes.headerResponseBlock)}>
              <strong className={cx(classes.headerTypography)}>{'Test data'}</strong>
              {currentTestCase.type === EvaluationType.PAIRWISE && (
                <Button kind="ghost" size="sm" renderIcon={Add} onClick={addResponse} disabled={evaluationRunning}>
                  {`Add ${toTitleCase(currentTestCase.criteria.predictionField)}`}
                </Button>
              )}
              <Button kind="ghost" size="sm" renderIcon={Add} onClick={addContextVariable} disabled={evaluationRunning}>
                {'Add Context Variable'}
              </Button>
            </div>
            <div className={cx(classes.blockElement, classes.headerBlock)}>
              <strong className={cx(classes.headerTypography)}>
                {returnByPipelineType(currentTestCase.type, 'Expected result', 'Expected winner')}
              </strong>
            </div>
            {(resultsAvailable || evaluationRunning) && (
              <div className={cx(classes.blockElement, classes.headerBlock)}>
                <strong className={classes.headerTypography}>
                  {returnByPipelineType(currentTestCase.type, 'Generated result', 'Generated winner')}
                </strong>
              </div>
            )}
          </div>
          <div className={cx(classes.tableRow, classes.subHeaderRow, gridClasses)}>
            <div className={cx(classes.tableRowSection)}>
              {responseNames.map((reponseName, i) => (
                <div key={i} className={cx(classes.blockElement, classes.subHeaderBlock)}>
                  <EditableTag
                    value={reponseName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setCurrentTestCase({
                        ...currentTestCase,
                        criteria: { ...currentTestCase.criteria, predictionField: e.target.value },
                      })
                    }
                    color="blue"
                    onEdit={returnByPipelineType(
                      currentTestCase.type,
                      undefined,
                      () => () => setEditPairwiseResponseNameModalOpen(true),
                    )}
                  />
                  {currentTestCase.type == EvaluationType.PAIRWISE &&
                    (instances[0] as PairwiseInstance).responses.length > 2 && (
                      <IconButton kind={'ghost'} label={'Remove'} onClick={() => removePairwiseResponse(i)}>
                        <TrashCan />
                      </IconButton>
                    )}
                </div>
              ))}
              {currentTestCase.criteria.contextFields.map((contextVariableName, i) => (
                <div key={i} className={cx(classes.blockElement, classes.subHeaderBlock)}>
                  <EditableTag
                    value={contextVariableName}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => editContextVariable(e.target.value, i)}
                    color="purple"
                  />
                  <IconButton kind={'ghost'} label={'Remove'} onClick={() => removeContextVariable(i)}>
                    <TrashCan />
                  </IconButton>
                </div>
              ))}
            </div>
            <div className={cx(classes.blockElement, classes.subHeaderBlock)} />
            {(resultsAvailable || evaluationRunning) && (
              <div className={cx(classes.blockElement, classes.subHeaderBlock)}></div>
            )}
          </div>

          {currentInstances.length === 0 && (
            <div className={cx(classes.tableRow, classes.columns1, classes.emptyTableRow)}>
              <div className={cx(classes.blockElement)}>
                <p className={classes.emptyText}>{'No instances to show'}</p>
              </div>
            </div>
          )}
          {currentInstances.map((instance, i) => (
            <TestDataTableRow
              key={i}
              setSelectedInstance={setSelectedInstance}
              setResultDetailsModalOpen={setResultDetailsModalOpen}
              evaluationRunning={evaluationRunning}
              isInstanceEvaluationRunning={evaluatingInstanceIds.includes(instance.id)}
              criteria={currentTestCase.criteria}
              gridClasses={gridClasses}
              instance={instance}
              setInstance={(instance) => setInstance(instance, i)}
              removeEnabled={currentTestCase.type !== EvaluationType.PAIRWISE || instances.length > 1}
              removeInstance={() => removeInstance(i)}
              type={currentTestCase.type}
              addInstance={addInstance}
              resultsAvailable={resultsAvailable}
              runEvaluation={runEvaluation}
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
                    onClick={onGenerateSyntheticDataClick}
                    disabled={currentTestCase.type == EvaluationType.PAIRWISE}
                  >
                    {'Generate test data'}
                  </Button>
                  <IconButton
                    kind={'tertiary'}
                    label={'Configure'}
                    size="sm"
                    onClick={() => setSyntheticGenerationModalOpen(true)}
                    disabled={currentTestCase.type == EvaluationType.PAIRWISE}
                  >
                    <SettingsAdjust />
                  </IconButton>
                </div>
              ) : null}
            </div>
            <div className={cx(classes.actionButton)}>
              <Button kind="tertiary" size="sm" renderIcon={Download} onClick={() => setImportTestDataModalOpen(true)}>
                {'Import test data'}
              </Button>
            </div>
          </div>
        </div>
      </div>
      {!evaluationRunning && resultsAvailable && noPositionalBias ? (
        <p style={{ marginTop: '0.5rem' }} className={classes.softText}>
          {'No positional bias was detected in any of the instances.'}
        </p>
      ) : null}
    </div>
  )
}
