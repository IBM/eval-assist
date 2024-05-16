import cx from 'classnames'

import Link from 'next/link'
import { useRouter } from 'next/router'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Launch } from '@carbon/react/icons'

import classes from './UseCasePanel.module.scss'
import { UseCase } from './types'

interface Props {
  onUseCaseClick: (useCase: UseCase) => void
  onClose: () => void
  userUseCases: UseCase[]
  currentUseCaseId: number | null
}

export const UserUseCasePanel = ({ onClose, onUseCaseClick, userUseCases, currentUseCaseId }: Props) => {
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
            <div className={classes['tree-wrapper']}>
              <TreeView className={classes['tree-root']} label={''}>
                {userUseCases.map((useCase) => (
                  <TreeNode
                    onClick={() => onUseCaseClick(useCase)}
                    key={useCase.id}
                    id={useCase.id}
                    label={
                      <div className={classes['tree-node-content']}>
                        {useCase.name}
                        <LinkButton useCase={useCase} />
                      </div>
                    }
                    selected={[useCase.id]}
                  />
                ))}
              </TreeView>
            </div>
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
