import cx from 'classnames'
import { PAIRWISE_NAME, RUBRIC_NAME } from 'src/constants'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Compare, List } from '@carbon/react/icons'

import { PipelineType, UseCase } from '../../../types'
import { useURLInfoContext } from '../Providers/URLInfoProvider'
import { LinkButton } from './LinkButton'
import classes from './UseCasePanel.module.scss'

interface Props {
  onUseCaseClick: (useCase: UseCase) => void
  onClose: () => void
  userUseCases: UseCase[]
}

export const UserUseCasePanel = ({ onClose, onUseCaseClick, userUseCases }: Props) => {
  const { useCaseId } = useURLInfoContext()

  const selectedNode = useMemo(() => {
    return useCaseId !== null ? [`${useCaseId}`] : []
  }, [useCaseId])

  const [expanded, setExpanded] = useState<{ rubric: boolean; pairwise: boolean }>({
    rubric: true,
    pairwise: true,
  })

  const rubricTestCases = useMemo(() => userUseCases.filter((u) => u.type === PipelineType.RUBRIC), [userUseCases])
  const pairwiseTestCases = useMemo(() => userUseCases.filter((u) => u.type === PipelineType.PAIRWISE), [userUseCases])

  const handleToggle = (key: 'rubric' | 'pairwise') =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  return (
    <section className={cx(classes.root)}>
      <header className={classes.header}>
        <h2 className={classes.heading}>My Test Cases</h2>
        <IconButton label="Close" align="right" kind="ghost" onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </header>
      <div className={classes.content}>
        <div className={classes.prompts}>
          <section className={classes.section}>
            {userUseCases.length === 0 ? (
              <p className={classes['empty-message']}>No saved test cases</p>
            ) : (
              <div className={classes['tree-wrapper']}>
                <TreeView className={classes['tree-root']} label={''} hideLabel selected={selectedNode}>
                  <TreeNode
                    id={'rubric'}
                    label={RUBRIC_NAME}
                    onSelect={() => handleToggle('rubric')}
                    onToggle={() => handleToggle('rubric')}
                    isExpanded={expanded['rubric']}
                  >
                    {rubricTestCases.length === 0 ? (
                      <p className={classes['empty-message']}>Empty</p>
                    ) : (
                      rubricTestCases.map((useCase) => (
                        <TreeNode
                          onSelect={() => {
                            onUseCaseClick(useCase)
                          }}
                          key={`${useCase.id}`}
                          id={`${useCase.id}`}
                          selected={selectedNode}
                          renderIcon={List}
                          label={
                            <div className={classes['tree-node-content']}>
                              <span className={classes['tree-node-label']}>{useCase.name}</span>
                              <LinkButton useCase={useCase} />
                            </div>
                          }
                        />
                      ))
                    )}
                  </TreeNode>
                  <TreeNode
                    id={'pairwise'}
                    label={PAIRWISE_NAME}
                    onSelect={() => handleToggle('pairwise')}
                    onToggle={() => handleToggle('pairwise')}
                    isExpanded={expanded['pairwise']}
                  >
                    {pairwiseTestCases.length === 0 ? (
                      <p className={classes['empty-message']}>Empty</p>
                    ) : (
                      pairwiseTestCases.map((useCase) => (
                        <TreeNode
                          onSelect={() => {
                            onUseCaseClick(useCase)
                          }}
                          key={`${useCase.id}`}
                          id={`${useCase.id}`}
                          selected={selectedNode}
                          renderIcon={Compare}
                          label={
                            <div className={classes['tree-node-content']}>
                              <span className={classes['tree-node-label']}>{useCase.name}</span>
                              <LinkButton useCase={useCase} />
                            </div>
                          }
                        />
                      ))
                    )}
                  </TreeNode>
                </TreeView>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
