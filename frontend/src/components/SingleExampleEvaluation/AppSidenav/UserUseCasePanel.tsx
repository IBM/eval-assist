import cx from 'classnames'

import { useMemo, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/router'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Launch } from '@carbon/react/icons'

import { PAIRWISE_NAME, RUBRIC_NAME } from '@utils/constants'

import { PipelineType, UseCase } from '../types'
import classes from './UseCasePanel.module.scss'

interface Props {
  onUseCaseClick: (useCase: UseCase) => void
  onClose: () => void
  userUseCases: UseCase[]
  currentUseCaseId: number | null
}

export const UserUseCasePanel = ({ onClose, onUseCaseClick, userUseCases, currentUseCaseId }: Props) => {
  const selectedNode = useMemo(() => {
    return currentUseCaseId !== null ? [`${currentUseCaseId}`] : []
  }, [currentUseCaseId])

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
                      <p className={classes['empty-message']}>No saved direct assessment test cases</p>
                    ) : (
                      rubricTestCases.map((useCase) => (
                        <TreeNode
                          onSelect={() => {
                            onUseCaseClick(useCase)
                          }}
                          key={`${useCase.id}`}
                          id={`${useCase.id}`}
                          selected={selectedNode}
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
                      <p className={classes['empty-message']}>No saved pairwise test cases</p>
                    ) : (
                      pairwiseTestCases.map((useCase) => (
                        <TreeNode
                          onSelect={() => {
                            onUseCaseClick(useCase)
                          }}
                          key={`${useCase.id}`}
                          id={`${useCase.id}`}
                          selected={selectedNode}
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

interface LinkButtonProps {
  useCase: UseCase
}

const LinkButton = ({ useCase }: LinkButtonProps) => {
  const router = useRouter()
  return (
    <Link
      onClick={(e) => e.stopPropagation()}
      className={classes['link-button']}
      target="_blank"
      rel="noopener noreferrer"
      href={`/?id=${useCase.id}`}
    >
      <Launch />
    </Link>
  )
}
