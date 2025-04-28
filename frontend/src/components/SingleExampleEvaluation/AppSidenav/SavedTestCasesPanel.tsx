import cx from 'classnames'
import { DIRECT_NAME, PAIRWISE_NAME } from 'src/constants'

import { useMemo, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Compare, List } from '@carbon/react/icons'

import { EvaluationType, UseCase } from '../../../types'
import { useURLParamsContext } from '../Providers/URLParamsProvider'
import { LinkButton } from './LinkButton'
import classes from './TwoLevelsPanel.module.scss'
import sharedClasses from './shared.module.scss'

interface Props {
  onUseCaseClick: (useCase: UseCase) => void
  onClose: () => void
  userUseCases: UseCase[]
}

export const SavedTestCasesPanel = ({ onClose, onUseCaseClick, userUseCases }: Props) => {
  const { useCaseId } = useURLParamsContext()

  const selectedNode = useMemo(() => {
    return useCaseId !== null ? [`${useCaseId}`] : []
  }, [useCaseId])

  const [expanded, setExpanded] = useState<{ direct: boolean; pairwise: boolean }>({
    direct: true,
    pairwise: true,
  })

  const directAssessmentTestCases = useMemo(
    () => userUseCases.filter((u) => u.type === EvaluationType.DIRECT),
    [userUseCases],
  )
  const pairwiseComparisonTestCases = useMemo(
    () => userUseCases.filter((u) => u.type === EvaluationType.PAIRWISE),
    [userUseCases],
  )

  const handleToggle = (key: 'direct' | 'pairwise') =>
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
                    id={'direct'}
                    label={DIRECT_NAME}
                    onSelect={() => handleToggle('direct')}
                    onToggle={() => handleToggle('direct')}
                    isExpanded={expanded['direct']}
                  >
                    {directAssessmentTestCases.length === 0 ? (
                      <p className={classes['empty-message']}>Empty</p>
                    ) : (
                      directAssessmentTestCases.map((useCase) => (
                        <TreeNode
                          onSelect={() => {
                            onUseCaseClick(useCase)
                          }}
                          key={`${useCase.id}`}
                          id={`${useCase.id}`}
                          selected={selectedNode}
                          renderIcon={List}
                          className={cx(sharedClasses.hovered)}
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
                    {pairwiseComparisonTestCases.length === 0 ? (
                      <p className={classes['empty-message']}>Empty</p>
                    ) : (
                      pairwiseComparisonTestCases.map((useCase) => (
                        <TreeNode
                          onSelect={() => {
                            onUseCaseClick(useCase)
                          }}
                          key={`${useCase.id}`}
                          id={`${useCase.id}`}
                          selected={selectedNode}
                          renderIcon={Compare}
                          className={cx(sharedClasses.hovered)}
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
