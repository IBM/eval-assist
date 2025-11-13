import cx from 'classnames'
import { returnByPipelineType } from 'src/utils'

import { CSSProperties, ChangeEvent, useCallback, useEffect, useMemo } from 'react'

import { PaginationNav } from '@carbon/react'

import { EditableTag } from '@components/EditableTag'
import { INSTANCES_PER_PAGE } from '@constants'
import { usePagination } from '@customHooks/usePagination'
import { useCurrentTestCase } from '@providers/CurrentTestCaseProvider'

import { Instance, PairwiseInstance } from '../../../types'
import { TestDataTableRow } from './TestDataTableRow'
import classes from './index.module.scss'

interface Props {
  style?: CSSProperties
  className?: string
}

export const InContextExampleTableTable = ({ style, className }: Props) => {
  const { currentTestCase, setCurrentTestCase } = useCurrentTestCase()
  const instancesPerPage = useMemo(() => INSTANCES_PER_PAGE, [])
  const instances = useMemo(() => currentTestCase.examples, [currentTestCase.examples])
  const { currentInstances, currentPage, goToPage, totalPages, goToLastPage } = usePagination({
    instances,
    instancesPerPage: instancesPerPage,
  })

  const setInstances = useCallback(
    (instances: Instance[]) => {
      setCurrentTestCase({ ...currentTestCase, examples: instances })
    },
    [currentTestCase, setCurrentTestCase],
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

  const convertInstanceToTestData = useCallback(
    (indexToConvert: number) => {
      const actualIndexToConvert = getActualInstanceIndex(indexToConvert)
      setCurrentTestCase({
        ...currentTestCase,
        examples: currentTestCase.examples.filter((_, i) => actualIndexToConvert !== i),
        instances: [...currentTestCase.instances, currentTestCase.examples[actualIndexToConvert]],
      })
    },
    [currentTestCase, getActualInstanceIndex, setCurrentTestCase],
  )

  return (
    <div style={style} className={className}>
      <div className={classes.content}>
        <div className={cx(classes.innerContainer)}>
          <div className={cx(classes.tableRow, classes.headerRow, classes.columns2)}>
            <div className={cx(classes.blockElement, classes.headerBlock, classes.headerResponseBlock)}>
              <strong className={cx(classes.headerTypography)}>{'In-context examples'}</strong>
            </div>
            <div className={cx(classes.blockElement, classes.headerBlock)}>
              <strong className={cx(classes.headerTypography)}>
                {returnByPipelineType(currentTestCase.type, 'Expected result', 'Expected winner')}
              </strong>
            </div>
          </div>
          <div className={cx(classes.tableRow, classes.subHeaderRow, classes.columns2)}>
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
                    isEditable={false}
                  />
                </div>
              ))}
              {currentTestCase.criteria.contextFields.map((contextVariableName, i) => (
                <div key={i} className={cx(classes.blockElement, classes.subHeaderBlock)}>
                  <EditableTag value={contextVariableName} color="purple" />
                </div>
              ))}
            </div>
            <div className={cx(classes.blockElement, classes.subHeaderBlock)} />
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
              instance={instance}
              setInstance={(instance) => setInstance(instance, i)}
              removeInstance={() => removeInstance(i)}
              type={currentTestCase.type}
              criteria={currentTestCase.criteria}
              convertInstanceToTestData={() => convertInstanceToTestData(i)}
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
        </div>
      </div>
    </div>
  )
}
