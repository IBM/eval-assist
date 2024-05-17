import cx from 'classnames'

import { ReactNode, useState } from 'react'

import { IconButton } from '@carbon/react'
// carbon doesnt yet have types of TreeView
// @ts-ignore
import { TreeNode, TreeView } from '@carbon/react'
import { ChevronLeft, Tree } from '@carbon/react/icons'

import { useCases } from '../UseCaseLibrary'
import { UseCase } from '../types'
import classes from './UseCasePanel.module.scss'

interface Props {
  onUseCaseClick: (useCase: UseCase) => void
  onClose: () => void
}

interface TreeNodeParentControlledProps {
  label: string
  children: ReactNode
  id: string
}

export const LibraryPanel = ({ onClose, onUseCaseClick }: Props) => {
  const [expanded, setExpanded] = useState<{ rubric: boolean; pairwise: boolean }>({
    rubric: false,
    pairwise: false,
  })

  const handleToggle = (key: 'rubric' | 'pairwise') =>
    setExpanded({
      ...expanded,
      [key]: !expanded[key],
    })

  return (
    <section className={cx(classes.root)}>
      <header className={classes.header}>
        <h2 className={classes.heading}>Test Case library</h2>
        <IconButton label="Close" align="right" kind="ghost" onClick={onClose}>
          <ChevronLeft />
        </IconButton>
      </header>
      <div className={classes.content}>
        <div className={classes.prompts}>
          <section className={classes.section}>
            <TreeView className={classes['tree-root']} label="">
              <TreeNode
                id={'rubric'}
                label="Rubric"
                onSelect={() => handleToggle('rubric')}
                onToggle={() => handleToggle('rubric')}
                isExpanded={expanded['rubric']}
              >
                {useCases.map((useCase, i) => (
                  <TreeNode
                    id={useCase.name}
                    label={useCase.name}
                    key={useCase.name}
                    onClick={(e: any) => {
                      e.stopPropagation()
                      e.preventDefault()
                      onUseCaseClick(useCase)
                    }}
                  />
                ))}
              </TreeNode>
              <TreeNode
                id={'pairwise'}
                label="Pairwise"
                onSelect={() => handleToggle('pairwise')}
                onToggle={() => handleToggle('pairwise')}
                isExpanded={expanded['pairwise']}
              >
                <TreeNode label={'Test Case 1'} key={1} />
                <TreeNode label={'Test Case 2'} key={2} />
              </TreeNode>
            </TreeView>
          </section>
        </div>
      </div>
    </section>
  )
}
