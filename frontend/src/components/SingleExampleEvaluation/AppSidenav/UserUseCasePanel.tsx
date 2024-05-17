import cx from 'classnames'

import { useMemo } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/router'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Launch } from '@carbon/react/icons'

import { UseCase } from '../types'
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

  return (
    <section className={cx(classes.root)}>
      <header className={classes.header}>
        <h2 className={classes.heading}>My Use Cases</h2>
        <IconButton label="Close" align="right" kind="ghost" onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </header>
      <div className={classes.content}>
        <div className={classes.prompts}>
          <section className={classes.section}>
            {/* <h3 className={classes.sectionHeading}>My saved prompts</h3> */}
            {userUseCases.length == 0 ? (
              <p className={classes.emptyMessage}>No saved test cases</p>
            ) : (
              <div className={classes['tree-wrapper']}>
                <TreeView className={classes['tree-root']} label={''} hideLabel selected={selectedNode}>
                  {userUseCases.map((useCase) => (
                    <TreeNode
                      onSelect={() => {
                        onUseCaseClick(useCase)
                      }}
                      key={`${useCase.id}`}
                      id={`${useCase.id}`}
                      selected={selectedNode}
                      label={
                        <div className={classes['tree-node-content']}>
                          {useCase.name}
                          <LinkButton useCase={useCase} />
                        </div>
                      }
                    />
                  ))}
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
